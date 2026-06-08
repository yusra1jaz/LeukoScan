import { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, Brain, Stethoscope, Shield, Users } from "lucide-react";

const FAQs = () => {
  const faqCategories = [
    {
      id: "leukemia-basics",
      title: "Leukemia Basics",
      icon: HelpCircle,
      color: "bg-primary/10 text-primary",
      faqs: [
        { question: "What is leukemia?", answer: "Leukemia is a type of cancer that affects blood-forming tissues, including bone marrow and the lymphatic system. It occurs when the body produces too many abnormal white blood cells, which don't function properly and can crowd out healthy blood cells." },
        { question: "What are the main types of leukemia?", answer: "There are four main types of leukemia: ALL (Acute Lymphoblastic Leukemia) - affects lymphoid cells and progresses quickly; AML (Acute Myeloid Leukemia) - affects myeloid cells and progresses quickly; CLL (Chronic Lymphocytic Leukemia) - affects lymphoid cells and progresses slowly; CML (Chronic Myeloid Leukemia) - affects myeloid cells and progresses slowly initially." },
        { question: "What causes leukemia?", answer: "The exact cause of leukemia is often unknown, but risk factors include genetic disorders, previous cancer treatment (chemotherapy/radiation), exposure to certain chemicals like benzene, smoking, and some genetic syndromes like Down syndrome. Most cases occur without any known risk factors." },
        { question: "What are the common symptoms of leukemia?", answer: "Common symptoms include fatigue and weakness, frequent infections, easy bruising or bleeding, fever or chills, unexplained weight loss, swollen lymph nodes, bone or joint pain, night sweats, and pale skin. However, symptoms can vary by type and individual." },
      ],
    },
    {
      id: "ai-diagnosis",
      title: "AI Diagnosis System",
      icon: Brain,
      color: "bg-success/10 text-success",
      faqs: [
        { question: "How accurate is the AI diagnosis system?", answer: "Our AI system has been trained on over 10,000 annotated blood smear images and achieves 91.2% accuracy on independent test sets. However, this tool is designed to assist healthcare professionals and should never replace professional medical evaluation and diagnosis." },
        { question: "What type of images can I upload?", answer: "You can upload clear, high-resolution blood smear microscopy images in common formats like JPG, PNG, or BMP. The images should be well-lit, in focus, and show individual blood cells clearly. Avoid blurry, dark, or low-resolution images for best results." },
        { question: "How does the AI make its diagnosis?", answer: "The AI uses deep learning convolutional neural networks to analyze cellular morphology, including cell size, shape, nucleus-to-cytoplasm ratio, chromatin patterns, and overall cell distribution. It compares these features against patterns learned from thousands of confirmed cases." },
        { question: "Can I trust the AI results?", answer: "While our AI is highly accurate, it should be used as a screening tool only. All results should be confirmed by qualified hematologists or oncologists. The AI provides confidence scores and explanations to help interpret results, but professional medical judgment is always required for final diagnosis." },
      ],
    },
    {
      id: "treatment",
      title: "Treatment Options",
      icon: Stethoscope,
      color: "bg-warning/10 text-warning",
      faqs: [
        { question: "What are the main treatment options for leukemia?", answer: "Treatment options vary by type and stage but include: Chemotherapy (most common), Radiation therapy, Targeted therapy (like Imatinib for CML), Immunotherapy, Stem cell/bone marrow transplant, and Clinical trials for experimental treatments. Treatment plans are always personalized." },
        { question: "How long does leukemia treatment take?", answer: "Treatment duration varies significantly by type: Acute leukemias (ALL/AML) typically require 6-12 months of intensive treatment, while chronic leukemias (CLL/CML) may require ongoing treatment for years. Some patients achieve long-term remission, while others need continuous monitoring and treatment." },
        { question: "What are the side effects of leukemia treatment?", answer: "Common side effects include fatigue, nausea, hair loss, increased infection risk, bruising/bleeding, mouth sores, and digestive issues. Long-term effects may include fertility issues, secondary cancers, and organ damage. Side effect management is an important part of treatment planning." },
        { question: "What is the prognosis for leukemia patients?", answer: "Prognosis varies widely by type, age, and individual factors. Generally: ALL has high cure rates in children (>90%) but lower in adults; AML has moderate cure rates improving with new treatments; CLL often has good long-term outlook with proper management; CML has excellent prognosis with targeted therapy." },
      ],
    },
    {
      id: "using-platform",
      title: "Using This Platform",
      icon: Shield,
      color: "bg-destructive/10 text-destructive",
      faqs: [
        { question: "Is my health information secure?", answer: "Yes, we take data security seriously. All uploaded images and personal health information are encrypted and stored securely. We comply with healthcare privacy regulations and do not share your data with third parties without explicit consent." },
        { question: "How do I use the symptom tracker?", answer: "Navigate to the Symptom Tracker page, rate each symptom on a scale of 0-10, add any notes about your condition, and save your entry. Regular tracking helps identify patterns and provides valuable information for your healthcare team." },
        { question: "Can I download my results?", answer: "Yes, you can download your AI diagnosis results as JSON files and export your symptom tracking data. This allows you to maintain your own records and share information with your healthcare providers easily." },
        { question: "How do I find specialists near me?", answer: "Use our Hospital Locator tool to find nearby hematologists and medical centers specializing in leukemia treatment. The tool provides contact information, specialties, ratings, and booking options for various healthcare facilities." },
      ],
    },
  ];

  const refs = faqCategories.reduce((acc, cat) => {
    acc[cat.id] = useRef<HTMLDivElement>(null);
    return acc;
  }, {} as Record<string, React.RefObject<HTMLDivElement>>);

  const scrollToSection = (id: string) => {
    refs[id]?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="container mx-auto px-8 py-8 max-w-7xl">
      {/* Page title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2 text-center">
          Frequently Asked Questions
        </h1>
      </div>

      {/* Top clickable cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
        {faqCategories.map((cat) => (
          <div
            key={cat.id}
            className="text-center cursor-pointer hover:shadow-lg transition-shadow p-6"
            onClick={() => scrollToSection(cat.id)}
          >
            <div className={`w-16 h-16 ${cat.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
              <cat.icon className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-semibold">{cat.title}</h3>
            <p className="text-lg text-muted-foreground mt-1">{cat.faqs.length} questions</p>
          </div>
        ))}
      </div>

      {/* FAQ sections */}
      <div className="space-y-12">
        {faqCategories.map((cat) => (
          <div key={cat.id} ref={refs[cat.id]}>
            <div className="flex items-center mb-6">
              <div className={`w-16 h-16 ${cat.color} rounded-full flex items-center justify-center mr-4`}>
                <cat.icon className="h-8 w-8" />
              </div>
              <h2 className="text-4xl font-bold text-left">{cat.title}</h2>
            </div>

            <div className="space-y-6">
              {cat.faqs.map((faq, idx) => (
                <div key={idx}>
                  <h3 className="text-2xl font-semibold text-left">{faq.question}</h3>
                  <p className="text-xl text-left text-foreground leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQs;
