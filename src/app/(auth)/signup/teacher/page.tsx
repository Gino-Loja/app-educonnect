import SignupForm from "../_template/signup-form";

export default function LearnerSignup() {
    return (
        <div className="min-h-screen mx-auto">

          <SignupForm userType="teacher" />
            
        </div>
    )
}