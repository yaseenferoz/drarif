export type QuestionType = "text" | "textarea" | "single-choice" | "yes-no";
export type AnswerValue = string | boolean | string[] | null;
export type VisibilityRule = { questionId: string; operator: "equals" | "not-equals" | "has-value"; value?: AnswerValue };
export type AssessmentQuestion = { id: string; section: string; label: string; type: QuestionType; required?: boolean; placeholder?: string; helpText?: string; options?: string[]; visibilityRules?: VisibilityRule[] };

export const assessmentQuestions: AssessmentQuestion[] = [
  { id: "concern", section: "Main concern", label: "What is the main symptom or concern you want Dr. Arif to review?", type: "textarea", required: true, placeholder: "Describe what you are experiencing" },
  { id: "duration", section: "Timeline", label: "How long has this been happening?", type: "text", required: true, placeholder: "For example: 3 days, 2 weeks, since January" },
  { id: "severity", section: "Symptoms", label: "How severe is it today?", type: "single-choice", required: true, options: ["Mild", "Moderate", "Severe", "Changing"] },
  { id: "warning", section: "Safety check", label: "Are you currently having bleeding, vomiting blood, black stools, severe sudden pain, fainting, confusion, or yellowing of the eyes?", type: "yes-no", required: true },
  { id: "history", section: "Medical history", label: "Anything else the doctor should know?", type: "textarea", placeholder: "Previous reports, medicines, allergies, diagnoses, or questions" },
];

export function visibleQuestions(answers: Record<string, AnswerValue>) {
  return assessmentQuestions.filter(question => !question.visibilityRules?.some(rule => {
    const value = answers[rule.questionId];
    if (rule.operator === "has-value") return value === null || value === "" || value === undefined;
    if (rule.operator === "equals") return value !== rule.value;
    return value === rule.value;
  }));
}

export function buildLocalReport(answers: Record<string, AnswerValue>) {
  const urgent = answers.warning === true || answers.warning === "Yes";
  return [
    "PRE-CONSULTATION SUMMARY — NOT A DIAGNOSIS",
    "Patient-reported information for Dr. Arif Raza’s clinician review. This is not a diagnosis, prescription, or emergency service.",
    `Main concern: ${answers.concern || "Not provided"}`,
    `Duration: ${answers.duration || "Not provided"}`,
    `Severity: ${answers.severity || "Not provided"}`,
    `Warning symptoms reported: ${urgent ? "Yes" : "No"}`,
    `Additional history and questions: ${answers.history || "None provided"}`,
    urgent ? "URGENT FLAG: The patient reported a warning symptom and should seek urgent medical care rather than wait for an online response." : "No warning symptoms were reported in this intake.",
  ].join("\n");
}
