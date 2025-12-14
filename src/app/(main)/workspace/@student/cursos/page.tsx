import Link from "next/link"
import Image from "next/image"
import { redirect } from "next/navigation"
import { IconBook, IconSearch, IconShoppingCart } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createClient } from "@/utils/supabase/server"
import { signLessonUrl } from "@/lib/data/course-actions"

type PublishedCourse = {
  id: string
  title: string
  description: string | null
  teacher: string
  price: number
  signed_cover_url: string | null
}

type PublishedCourseRow = {
  id: string
  title: string
  description: string | null
  price: number
  cover_url: string | null
  teacher: { name: string | null } | null
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value || 0)
}

type Props = {
  searchParams?: { page?: string; q?: string; sort?: string }
}

const PAGE_SIZE = 20

export default async function CursosPage({ searchParams }: Props) {
  try {
    const { page: pageParam, q: queryParam, sort: sortParam } = searchParams ?? {}
    const page = Math.max(1, Number(pageParam) || 1)
    const searchQuery = (queryParam || "").trim()
    const sortOption = ["recent", "old", "price_desc", "price_asc"].includes(sortParam || "")
      ? (sortParam as "recent" | "old" | "price_desc" | "price_asc")
      : "recent"

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect("/login")
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "student" && profile?.role !== "admin") {
      redirect("/workspace")
    }

    const { data: enrollmentsData = [], error: enrollmentsError } = await supabase
      .from("enrollments")
      .select("course_id")
      .eq("student_id", user.id)
      .in("status", ["active", "pending"])

    if (enrollmentsError) {
      throw new Error(`Inscripciones: ${enrollmentsError.message}`)
    }

    const enrolledCourseIds = (enrollmentsData || [])
      .map((row) => row.course_id as string | null)
      .filter((id): id is string => Boolean(id))

    let catalogQuery = supabase
      .from("courses")
      .select(
        `
        id,
        title,
        description,
        price,
        cover_url,
        teacher:profiles!courses_teacher_id_fkey (
          name
        )
      `,
        { count: "exact" },
      )
      .eq("status", "published")

    if (enrolledCourseIds.length > 0) {
      // Supabase .not with 'in' operator likely needs explicit parens for the list
      // and raw UUIDs without quotes if the library doesn't auto-format in .not()
      const idsFormatted = `(${enrolledCourseIds.map(id => `"${id}"`).join(',')})`
      catalogQuery = catalogQuery.filter("id", "not.in", idsFormatted)
    }

    if (searchQuery) {
      catalogQuery = catalogQuery.ilike("title", `%${searchQuery}%`)
    }

    switch (sortOption) {
      case "old":
        catalogQuery = catalogQuery.order("created_at", { ascending: true })
        break
      case "price_desc":
        catalogQuery = catalogQuery.order("price", { ascending: false }).order("created_at", { ascending: false })
        break
      case "price_asc":
        catalogQuery = catalogQuery.order("price", { ascending: true }).order("created_at", { ascending: false })
        break
      case "recent":
      default:
        catalogQuery = catalogQuery.order("created_at", { ascending: false })
        break
    }

    const {
      data: publishedCoursesData = [],
      count: catalogCount = 0,
      error: catalogError,
    } = await catalogQuery.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

    if (catalogError) {
      throw new Error(`Catalogo: ${catalogError.message}`)
    }

    const publishedCourses: PublishedCourse[] = await Promise.all(
      ((publishedCoursesData as PublishedCourseRow[]) || [])
        .filter((course): course is PublishedCourseRow => Boolean(course && course.id))
        .map(async (course) => {
          const signed_cover_url = await signLessonUrl(course.cover_url)
          return {
            id: course.id,
            title: course.title,
            description: course.description,
            teacher: course.teacher?.name || "Docente",
            price: course.price,
            signed_cover_url,
          }
        }),
    )

    const totalPages = Math.max(1, Math.ceil((catalogCount ?? 0) / PAGE_SIZE))

    return (
      <div className="flex flex-col gap-6 px-4 py-4 md:px-6 md:py-6">
        <Card className="p-4">
          <form className="grid gap-3 md:grid-cols-[1fr_220px_auto] items-center" action="/workspace/cursos">
            <div className="flex items-center gap-2">
              <IconSearch className="h-4 w-4 text-muted-foreground" />
              <Input
                name="q"
                placeholder="Buscar cursos por nombre"
                defaultValue={searchQuery}
                className="w-full"
              />
            </div>
            <Select name="sort" defaultValue={sortOption}>
              <SelectTrigger>
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recientes</SelectItem>
                <SelectItem value="old">Antiguos</SelectItem>
                <SelectItem value="price_desc">Precio: alto a bajo</SelectItem>
                <SelectItem value="price_asc">Precio: bajo a alto</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center justify-end gap-2">
              <Button type="submit" variant="secondary">
                Filtrar
              </Button>
            </div>
          </form>
        </Card>

        {publishedCourses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-start gap-3 p-6">
              <p className="text-lg font-semibold text-slate-800">No hay cursos disponibles</p>
              <p className="text-sm text-muted-foreground">
                Por el momento no hay cursos publicados en el catálogo.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {publishedCourses.map((course) => (
                <Card key={course.id} className="flex flex-col overflow-hidden">
                  {course.signed_cover_url ? (
                    <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                      <Image
                        src={course.signed_cover_url}
                        alt={course.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                  ) : (
                    <div className="relative aspect-video w-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center">
                      <IconBook className="h-12 w-12 text-indigo-400" />
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      <Badge variant="outline" className="shrink-0">
                        {formatCurrency(course.price)}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm text-muted-foreground">
                      Por {course.teacher}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-3">
                    {course.description && (
                      <p className="text-sm text-slate-600 line-clamp-2">{course.description}</p>
                    )}
                    <Button className="w-full mt-auto" asChild>
                      <Link href={`/workspace/cursos/${course.id}`}>
                        <IconShoppingCart className="mr-2 h-4 w-4" />
                        Ver detalles
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <span className="text-sm text-muted-foreground">
                Pagina {page} de {totalPages} ({catalogCount} cursos)
              </span>
              <div className="flex items-center gap-2">
                {page > 1 && page <= totalPages ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={`/workspace/cursos?page=${page - 1}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""}${sortOption ? `&sort=${sortOption}` : ""}`}
                    >
                      Anterior
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    Anterior
                  </Button>
                )}
                {page < totalPages ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={`/workspace/cursos?page=${page + 1}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""}${sortOption ? `&sort=${sortOption}` : ""}`}
                    >
                      Siguiente
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    Siguiente
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    )
  } catch (error) {
    return (
      <div className="flex flex-col gap-4 px-4 py-6 md:px-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-red-600">
              Error al cargar cursos: {error instanceof Error ? error.message : "Desconocido"}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }
}
