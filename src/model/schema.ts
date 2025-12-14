export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      academic_catalog: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          label: string
          order_index: number | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          order_index?: number | null
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          order_index?: number | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          last_message: string | null
          last_message_at: string | null
          last_message_sender_id: string | null
          student_id: string
          task_id: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          last_message_sender_id?: string | null
          student_id: string
          task_id: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          last_message_sender_id?: string | null
          student_id?: string
          task_id?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_last_message_sender_id_fkey"
            columns: ["last_message_sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_conversations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_conversations_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: true
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_conversations_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          position: number
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          position?: number
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          position?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          price: number
          status: string
          teacher_id: string
          title: string
          updated_at: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          price?: number
          status?: string
          teacher_id: string
          title: string
          updated_at?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          price?: number
          status?: string
          teacher_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          course_id: string
          created_at: string
          id: string
          notes: string | null
          paid_amount: number
          proof_url: string | null
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          notes?: string | null
          paid_amount?: number
          proof_url?: string | null
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          paid_amount?: number
          proof_url?: string | null
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed_at: string
          enrollment_id: string
          id: string
          lesson_id: string
        }
        Insert: {
          completed_at?: string
          enrollment_id: string
          id?: string
          lesson_id: string
        }
        Update: {
          completed_at?: string
          enrollment_id?: string
          id?: string
          lesson_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_questions: {
        Row: {
          correct_answer: string | null
          created_at: string
          feedback: string | null
          id: string
          lesson_id: string
          options: Json | null
          position: number
          prompt: string
          question_type: string
        }
        Insert: {
          correct_answer?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          lesson_id: string
          options?: Json | null
          position?: number
          prompt: string
          question_type: string
        }
        Update: {
          correct_answer?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          lesson_id?: string
          options?: Json | null
          position?: number
          prompt?: string
          question_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content_type: string | null
          content_url: string | null
          created_at: string
          duration_minutes: number | null
          id: string
          module_id: string
          pass_score: number | null
          position: number
          text_content: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content_type?: string | null
          content_url?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          module_id: string
          pass_score?: number | null
          position?: number
          text_content?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content_type?: string | null
          content_url?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          module_id?: string
          pass_score?: number | null
          position?: number
          text_content?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          metadata: Json | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          metadata?: Json | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          metadata?: Json | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_milestones: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          milestone_number: number
          paid_at: string | null
          paid_by: string | null
          payment_proof_url: string | null
          payment_reference: string | null
          rejection_reason: string | null
          status: string
          submission_id: string | null
          submitted_at: string | null
          task_id: string
          title: string
          updated_at: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          milestone_number: number
          paid_at?: string | null
          paid_by?: string | null
          payment_proof_url?: string | null
          payment_reference?: string | null
          rejection_reason?: string | null
          status?: string
          submission_id?: string | null
          submitted_at?: string | null
          task_id: string
          title: string
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          milestone_number?: number
          paid_at?: string | null
          paid_by?: string | null
          payment_proof_url?: string | null
          payment_reference?: string | null
          rejection_reason?: string | null
          status?: string
          submission_id?: string | null
          submitted_at?: string | null
          task_id?: string
          title?: string
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_milestones_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "task_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_milestones_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          created_at: string
          enrollment_id: string
          id: string
          method: string
          payout_id: string | null
          proof_url: string | null
          status: string
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          enrollment_id: string
          id?: string
          method: string
          payout_id?: string | null
          proof_url?: string | null
          status?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          enrollment_id?: string
          id?: string
          method?: string
          payout_id?: string | null
          proof_url?: string | null
          status?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "payouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount: number
          created_at: string
          id: string
          paid_at: string | null
          period: string | null
          status: string
          teacher_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          paid_at?: string | null
          period?: string | null
          status?: string
          teacher_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          paid_at?: string | null
          period?: string | null
          status?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          account_holder: string | null
          account_number: string | null
          account_type: string | null
          bank_name: string | null
          commission_rate: number
          contact_email: string | null
          country: string | null
          created_at: string | null
          currency: string | null
          fiscal_id: string | null
          id: string
          swift_code: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          account_holder?: string | null
          account_number?: string | null
          account_type?: string | null
          bank_name?: string | null
          commission_rate?: number
          contact_email?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          fiscal_id?: string | null
          id?: string
          swift_code?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          account_holder?: string | null
          account_number?: string | null
          account_type?: string | null
          bank_name?: string | null
          commission_rate?: number
          contact_email?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          fiscal_id?: string | null
          id?: string
          swift_code?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bio: string | null
          city: string | null
          country: string | null
          created_at: string | null
          date_of_birth: string | null
          deleted_at: string | null
          email: string
          email_notifications: boolean | null
          gender: string | null
          headline: string | null
          id: string
          is_active: boolean | null
          last_active_at: string | null
          lastname: string | null
          linkedin_url: string | null
          name: string | null
          onboarding_completed: boolean | null
          phone: string | null
          profile_completion_percentage: number | null
          profile_picture_url: string | null
          profile_visibility: string | null
          push_notifications: boolean | null
          role: string
          state: string | null
          total_rating: number | null
          total_reviews: number | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          email: string
          email_notifications?: boolean | null
          gender?: string | null
          headline?: string | null
          id: string
          is_active?: boolean | null
          last_active_at?: string | null
          lastname?: string | null
          linkedin_url?: string | null
          name?: string | null
          onboarding_completed?: boolean | null
          phone?: string | null
          profile_completion_percentage?: number | null
          profile_picture_url?: string | null
          profile_visibility?: string | null
          push_notifications?: boolean | null
          role: string
          state?: string | null
          total_rating?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          email?: string
          email_notifications?: boolean | null
          gender?: string | null
          headline?: string | null
          id?: string
          is_active?: boolean | null
          last_active_at?: string | null
          lastname?: string | null
          linkedin_url?: string | null
          name?: string | null
          onboarding_completed?: boolean | null
          phone?: string | null
          profile_completion_percentage?: number | null
          profile_picture_url?: string | null
          profile_visibility?: string | null
          push_notifications?: boolean | null
          role?: string
          state?: string | null
          total_rating?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      proposals: {
        Row: {
          cover_letter: string
          created_at: string
          estimated_hours: number | null
          id: string
          is_active: boolean
          message: string | null
          proposed_amount: number
          response_date: string | null
          status: Database["public"]["Enums"]["proposal_status"]
          task_id: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          cover_letter: string
          created_at?: string
          estimated_hours?: number | null
          id?: string
          is_active?: boolean
          message?: string | null
          proposed_amount: number
          response_date?: string | null
          status?: Database["public"]["Enums"]["proposal_status"]
          task_id: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          cover_letter?: string
          created_at?: string
          estimated_hours?: number | null
          id?: string
          is_active?: boolean
          message?: string | null
          proposed_amount?: number
          response_date?: string | null
          status?: Database["public"]["Enums"]["proposal_status"]
          task_id?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposals_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          communication_rating: number | null
          created_at: string
          id: string
          is_edited: boolean
          is_public: boolean
          professionalism_rating: number | null
          quality_rating: number | null
          rating: number
          reviewee_id: string
          reviewer_id: string
          task_id: string
          updated_at: string
        }
        Insert: {
          comment?: string | null
          communication_rating?: number | null
          created_at?: string
          id?: string
          is_edited?: boolean
          is_public?: boolean
          professionalism_rating?: number | null
          quality_rating?: number | null
          rating: number
          reviewee_id: string
          reviewer_id: string
          task_id: string
          updated_at?: string
        }
        Update: {
          comment?: string | null
          communication_rating?: number | null
          created_at?: string
          id?: string
          is_edited?: boolean
          is_public?: boolean
          professionalism_rating?: number | null
          quality_rating?: number | null
          rating?: number
          reviewee_id?: string
          reviewer_id?: string
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number | null
          student_id: string
          task_id: string | null
          teacher_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number | null
          student_id: string
          task_id?: string | null
          teacher_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number | null
          student_id?: string
          task_id?: string | null
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_reviews_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_reviews_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_reviews_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          academic_level: string | null
          budget_range: string | null
          created_at: string | null
          current_grade: string | null
          expected_graduation: string | null
          favorite_teachers: string[] | null
          graduation_year: number | null
          id: string
          institution_id: string | null
          major: string | null
          max_budget_per_task: number | null
          payment_methods: Json | null
          preferred_communication: string | null
          preferred_learning_style: string | null
          preferred_task_duration: string | null
          student_type: string | null
          subjects: string[] | null
          subjects_of_interest: string[] | null
          total_spent: number | null
          total_tasks_completed: number | null
          total_tasks_created: number | null
          university: string | null
          updated_at: string | null
        }
        Insert: {
          academic_level?: string | null
          budget_range?: string | null
          created_at?: string | null
          current_grade?: string | null
          expected_graduation?: string | null
          favorite_teachers?: string[] | null
          graduation_year?: number | null
          id: string
          institution_id?: string | null
          major?: string | null
          max_budget_per_task?: number | null
          payment_methods?: Json | null
          preferred_communication?: string | null
          preferred_learning_style?: string | null
          preferred_task_duration?: string | null
          student_type?: string | null
          subjects?: string[] | null
          subjects_of_interest?: string[] | null
          total_spent?: number | null
          total_tasks_completed?: number | null
          total_tasks_created?: number | null
          university?: string | null
          updated_at?: string | null
        }
        Update: {
          academic_level?: string | null
          budget_range?: string | null
          created_at?: string | null
          current_grade?: string | null
          expected_graduation?: string | null
          favorite_teachers?: string[] | null
          graduation_year?: number | null
          id?: string
          institution_id?: string | null
          major?: string | null
          max_budget_per_task?: number | null
          payment_methods?: Json | null
          preferred_communication?: string | null
          preferred_learning_style?: string | null
          preferred_task_duration?: string | null
          student_type?: string | null
          subjects?: string[] | null
          subjects_of_interest?: string[] | null
          total_spent?: number | null
          total_tasks_completed?: number | null
          total_tasks_created?: number | null
          university?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_comments: {
        Row: {
          author_id: string
          author_role: string
          created_at: string
          id: string
          message: string
          submission_id: string
        }
        Insert: {
          author_id: string
          author_role: string
          created_at?: string
          id?: string
          message: string
          submission_id: string
        }
        Update: {
          author_id?: string
          author_role?: string
          created_at?: string
          id?: string
          message?: string
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submission_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_comments_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "task_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      task_attachments: {
        Row: {
          attachment_type: string
          created_at: string
          description: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          is_active: boolean
          milestone_id: string | null
          task_id: string
          uploaded_by: string
        }
        Insert: {
          attachment_type: string
          created_at?: string
          description?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          is_active?: boolean
          milestone_id?: string | null
          task_id: string
          uploaded_by: string
        }
        Update: {
          attachment_type?: string
          created_at?: string
          description?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          is_active?: boolean
          milestone_id?: string | null
          task_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_attachments_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "payment_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_submissions: {
        Row: {
          attachments: Json | null
          content: string
          created_at: string
          id: string
          is_approved: boolean | null
          is_final: boolean
          notes: string | null
          review_status: Database["public"]["Enums"]["submission_review_status"]
          reviewed_at: string | null
          student_feedback: string | null
          submitted_at: string
          task_id: string
          teacher_id: string
          updated_at: string
          version: number
        }
        Insert: {
          attachments?: Json | null
          content: string
          created_at?: string
          id?: string
          is_approved?: boolean | null
          is_final?: boolean
          notes?: string | null
          review_status?: Database["public"]["Enums"]["submission_review_status"]
          reviewed_at?: string | null
          student_feedback?: string | null
          submitted_at?: string
          task_id: string
          teacher_id: string
          updated_at?: string
          version?: number
        }
        Update: {
          attachments?: Json | null
          content?: string
          created_at?: string
          id?: string
          is_approved?: boolean | null
          is_final?: boolean
          notes?: string | null
          review_status?: Database["public"]["Enums"]["submission_review_status"]
          reviewed_at?: string | null
          student_feedback?: string | null
          submitted_at?: string
          task_id?: string
          teacher_id?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "task_submissions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_submissions_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          academic_level: string
          attachments: Json | null
          budget_max: number | null
          budget_min: number | null
          completion_date: string | null
          created_at: string
          description: string
          difficulty: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          installments: number | null
          is_active: boolean
          payment_type: Database["public"]["Enums"]["payment_type"] | null
          priority: Database["public"]["Enums"]["task_priority"]
          proposals_count: number
          selected_proposal_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          student_id: string
          subject: string
          teacher_id: string | null
          title: string
          topic_tags: string[] | null
          updated_at: string
        }
        Insert: {
          academic_level: string
          attachments?: Json | null
          budget_max?: number | null
          budget_min?: number | null
          completion_date?: string | null
          created_at?: string
          description: string
          difficulty?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          installments?: number | null
          is_active?: boolean
          payment_type?: Database["public"]["Enums"]["payment_type"] | null
          priority?: Database["public"]["Enums"]["task_priority"]
          proposals_count?: number
          selected_proposal_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          student_id: string
          subject: string
          teacher_id?: string | null
          title: string
          topic_tags?: string[] | null
          updated_at?: string
        }
        Update: {
          academic_level?: string
          attachments?: Json | null
          budget_max?: number | null
          budget_min?: number | null
          completion_date?: string | null
          created_at?: string
          description?: string
          difficulty?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          installments?: number | null
          is_active?: boolean
          payment_type?: Database["public"]["Enums"]["payment_type"] | null
          priority?: Database["public"]["Enums"]["task_priority"]
          proposals_count?: number
          selected_proposal_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          student_id?: string
          subject?: string
          teacher_id?: string | null
          title?: string
          topic_tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_selected_proposal"
            columns: ["selected_proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_bank_accounts: {
        Row: {
          account_alias: string | null
          account_holder: string
          account_number: string
          account_type: string | null
          bank_name: string
          country: string | null
          created_at: string
          currency: string | null
          id: string
          routing_number: string | null
          teacher_id: string
          updated_at: string
        }
        Insert: {
          account_alias?: string | null
          account_holder: string
          account_number: string
          account_type?: string | null
          bank_name: string
          country?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          routing_number?: string | null
          teacher_id: string
          updated_at?: string
        }
        Update: {
          account_alias?: string | null
          account_holder?: string
          account_number?: string
          account_type?: string | null
          bank_name?: string
          country?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          routing_number?: string | null
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_bank_accounts_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number | null
          student_id: string
          task_id: string | null
          teacher_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number | null
          student_id: string
          task_id?: string | null
          teacher_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number | null
          student_id?: string
          task_id?: string | null
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_reviews_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_reviews_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_reviews_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          accepts_long_term: boolean | null
          accepts_urgent_tasks: boolean | null
          alma_mater: string | null
          availability_hours: Json | null
          bank_account_verified: boolean | null
          certifications: string[] | null
          completion_rate: number | null
          created_at: string | null
          currency: string | null
          degrees: string[] | null
          education_level: string | null
          education_levels_taught: string[] | null
          emergency_contact: Json | null
          experience: string | null
          github_url: string | null
          hourly_rate: number
          id: string
          is_available: boolean | null
          languages: string[]
          max_concurrent_tasks: number | null
          max_project_budget: number | null
          min_project_budget: number | null
          native_language: string | null
          payment_info: Json | null
          payment_methods_accepted: string[] | null
          portfolio_url: string | null
          preferred_task_types: string[] | null
          repeat_client_rate: number | null
          response_time_hours: number | null
          sample_work_urls: string[] | null
          specialties: string[]
          subjects: string[]
          success_rate: number | null
          tax_id: string | null
          teaching_experience_years: number | null
          teaching_methodology: string | null
          tools_used: string[] | null
          total_earnings: number | null
          total_experience_years: number | null
          total_tasks_completed: number | null
          updated_at: string | null
          video_introduction_url: string | null
        }
        Insert: {
          accepts_long_term?: boolean | null
          accepts_urgent_tasks?: boolean | null
          alma_mater?: string | null
          availability_hours?: Json | null
          bank_account_verified?: boolean | null
          certifications?: string[] | null
          completion_rate?: number | null
          created_at?: string | null
          currency?: string | null
          degrees?: string[] | null
          education_level?: string | null
          education_levels_taught?: string[] | null
          emergency_contact?: Json | null
          experience?: string | null
          github_url?: string | null
          hourly_rate: number
          id: string
          is_available?: boolean | null
          languages?: string[]
          max_concurrent_tasks?: number | null
          max_project_budget?: number | null
          min_project_budget?: number | null
          native_language?: string | null
          payment_info?: Json | null
          payment_methods_accepted?: string[] | null
          portfolio_url?: string | null
          preferred_task_types?: string[] | null
          repeat_client_rate?: number | null
          response_time_hours?: number | null
          sample_work_urls?: string[] | null
          specialties?: string[]
          subjects?: string[]
          success_rate?: number | null
          tax_id?: string | null
          teaching_experience_years?: number | null
          teaching_methodology?: string | null
          tools_used?: string[] | null
          total_earnings?: number | null
          total_experience_years?: number | null
          total_tasks_completed?: number | null
          updated_at?: string | null
          video_introduction_url?: string | null
        }
        Update: {
          accepts_long_term?: boolean | null
          accepts_urgent_tasks?: boolean | null
          alma_mater?: string | null
          availability_hours?: Json | null
          bank_account_verified?: boolean | null
          certifications?: string[] | null
          completion_rate?: number | null
          created_at?: string | null
          currency?: string | null
          degrees?: string[] | null
          education_level?: string | null
          education_levels_taught?: string[] | null
          emergency_contact?: Json | null
          experience?: string | null
          github_url?: string | null
          hourly_rate?: number
          id?: string
          is_available?: boolean | null
          languages?: string[]
          max_concurrent_tasks?: number | null
          max_project_budget?: number | null
          min_project_budget?: number | null
          native_language?: string | null
          payment_info?: Json | null
          payment_methods_accepted?: string[] | null
          portfolio_url?: string | null
          preferred_task_types?: string[] | null
          repeat_client_rate?: number | null
          response_time_hours?: number | null
          sample_work_urls?: string[] | null
          specialties?: string[]
          subjects?: string[]
          success_rate?: number | null
          tax_id?: string | null
          teaching_experience_years?: number | null
          teaching_methodology?: string | null
          tools_used?: string[] | null
          total_earnings?: number | null
          total_experience_years?: number | null
          total_tasks_completed?: number | null
          updated_at?: string | null
          video_introduction_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teachers_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_missing_profiles: { Args: never; Returns: undefined }
      create_notification: {
        Args: {
          p_link?: string
          p_message: string
          p_metadata?: Json
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      is_admin: { Args: { user_id: string }; Returns: boolean }
      is_chat_participant: {
        Args: { conversation_id: string }
        Returns: boolean
      }
    }
    Enums: {
      payment_type: "per_hour" | "fixed" | "negotiable"
      proposal_status: "pending" | "accepted" | "rejected" | "withdrawn"
      submission_review_status:
        | "pending_review"
        | "changes_requested"
        | "approved"
      task_priority: "low" | "normal" | "high" | "urgent"
      task_status:
        | "open"
        | "in_progress"
        | "submitted"
        | "completed"
        | "cancelled"
        | "disputed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      payment_type: ["per_hour", "fixed", "negotiable"],
      proposal_status: ["pending", "accepted", "rejected", "withdrawn"],
      submission_review_status: [
        "pending_review",
        "changes_requested",
        "approved",
      ],
      task_priority: ["low", "normal", "high", "urgent"],
      task_status: [
        "open",
        "in_progress",
        "submitted",
        "completed",
        "cancelled",
        "disputed",
      ],
    },
  },
} as const
