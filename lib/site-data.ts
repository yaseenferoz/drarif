export type Treatment = {
  id?: string; slug: string; title: string; eyebrow: string; excerpt: string;
  image_url: string; symptoms: string[]; evaluations: string[]; treatments: string[];
  preparation: string[]; recovery: string; urgent_signs: string[]; published?: boolean; sort_order?: number;
};

export type Article = {
  id?: string; slug: string; title: string; excerpt: string; category: string;
  image_url: string; reading_minutes: number; content: string; published?: boolean; published_at?: string;
};

export const site = {
  doctor: "Dr. Arif Raza",
  credentials: "Consultant GI, HPB, GI Oncology & Advanced Laparoscopic Surgeon",
  phone: "+91 91879 66771",
  phoneHref: "+919187966771",
  whatsapp: "919187966771",
  email: "dr.raza@nkhospital.in",
  hospital: "NK Hospital",
  location: "Kalaburagi, Karnataka",
  hours: "Monday – Saturday · 9:00 AM – 7:00 PM"
};

const common = {
  symptoms: ["Persistent or worsening abdominal pain", "Vomiting, bleeding or altered bowel habits", "Unexplained weight loss, anemia or jaundice"],
  evaluations: ["Detailed consultation and physical examination", "Blood tests and specialist imaging when indicated", "Endoscopic evaluation or biopsy where appropriate"],
  preparation: ["Share current medicines, allergies and previous reports", "Complete advised blood tests and imaging", "Follow fasting and medicine instructions carefully"],
  urgent_signs: ["Severe or rapidly worsening pain", "Blood in vomit or black stools", "High fever, repeated vomiting, fainting or jaundice"],
};

export const treatments: Treatment[] = [
  { slug:"gi-cancer-surgery", title:"GI Cancer Surgery", eyebrow:"ONCOLOGY CARE", excerpt:"Multidisciplinary surgical care for cancers of the stomach, colon, rectum, liver and pancreas.", image_url:"/assets/img/team/gicancer.png", ...common, treatments:["Cancer-focused surgery with clear margin and lymph node planning","Laparoscopic or open approach based on safety","Coordination with medical and radiation oncology"], recovery:"Recovery and follow-up are planned around the operation, pathology results and any additional oncology treatment.", sort_order:1 },
  { slug:"advanced-laparoscopic-surgery", title:"Advanced Laparoscopic Surgery", eyebrow:"MINIMALLY INVASIVE CARE", excerpt:"Keyhole surgery for suitable digestive conditions, designed for smaller incisions and supported recovery.", image_url:"/assets/img/service/laprosocopic.png", ...common, treatments:["Laparoscopic gallbladder and hernia procedures","Advanced GI and colorectal laparoscopy","Conversion to open surgery only when safety requires it"], recovery:"Early walking, pain control and a staged return to diet and activity support recovery.", sort_order:2 },
  { slug:"hernia-surgery", title:"Hernia Surgery", eyebrow:"ABDOMINAL WALL REPAIR", excerpt:"Open and laparoscopic repair for inguinal, umbilical, incisional and recurrent hernias.", image_url:"/assets/img/team/hernia.png", ...common, treatments:["Open or laparoscopic mesh repair","Individual planning for recurrent or complex hernia","Risk-factor optimisation before surgery"], recovery:"Walking starts early; lifting and exercise resume according to the repair and your work.", sort_order:3 },
  { slug:"hpb-surgery", title:"HPB Surgery", eyebrow:"LIVER · PANCREAS · BILIARY", excerpt:"Specialist assessment and surgery for liver, pancreatic, gallbladder and bile duct disease.", image_url:"/assets/img/team/liver.png", ...common, treatments:["Gallbladder and bile duct surgery","Liver and pancreatic procedures","Coordination with ERCP and oncology teams"], recovery:"Major HPB procedures need structured nutrition, symptom and imaging follow-up.", sort_order:4 },
  { slug:"bariatric-surgery", title:"Bariatric Surgery", eyebrow:"METABOLIC HEALTH", excerpt:"Evidence-based weight-loss surgery for eligible patients with long-term nutrition and lifestyle support.", image_url:"/assets/img/service/ser8-5.jpg", ...common, treatments:["Sleeve gastrectomy or bypass when appropriate","Metabolic risk assessment","Long-term diet and vitamin monitoring"], recovery:"Diet advances in stages, with ongoing nutrition, activity and metabolic follow-up.", sort_order:5 },
  { slug:"colorectal-surgery", title:"Colorectal Surgery", eyebrow:"COLON & RECTAL CARE", excerpt:"Surgery for colorectal cancer, diverticular disease, obstruction and other bowel conditions.", image_url:"/assets/img/service/ser8-3.jpg", ...common, treatments:["Laparoscopic or open bowel resection","Cancer surgery with pathology planning","Stoma care when temporarily or permanently required"], recovery:"Diet, bowel function, wound care and pathology are reviewed closely after surgery.", sort_order:6 },
  { slug:"upper-gi-surgery", title:"Upper GI Surgery", eyebrow:"ESOPHAGUS & STOMACH", excerpt:"Surgical care for selected diseases of the esophagus, stomach and duodenum.", image_url:"/assets/img/service/ser8-1.jpg", ...common, treatments:["Surgery for tumors and obstruction","Selected anti-reflux and ulcer procedures","Laparoscopic approach where suitable"], recovery:"Diet restarts gradually; major procedures may need smaller meals and nutrition support.", sort_order:7 },
  { slug:"upper-gi-endoscopy", title:"Upper GI Endoscopy", eyebrow:"DIAGNOSTIC ENDOSCOPY", excerpt:"Camera examination of the food pipe, stomach and duodenum for diagnosis, biopsy and selected treatment.", image_url:"/assets/img/service/sr-d-1.jpg", ...common, treatments:["Diagnostic gastroscopy and biopsy","Control of selected bleeding lesions","Dilatation or removal when clinically suitable"], recovery:"Most patients return home the same day; driving is avoided after sedation.", sort_order:8 },
  { slug:"colonoscopy", title:"Colonoscopy", eyebrow:"COLON EXAMINATION", excerpt:"Examination of the colon and rectum for bleeding, bowel change, polyps and cancer screening.", image_url:"/assets/img/service/sr-d-2.jpg", ...common, treatments:["Diagnostic examination and biopsy","Polyp removal where appropriate","Surveillance planning based on findings"], recovery:"Temporary gas or cramps may occur. Biopsy and surveillance results are reviewed afterward.", sort_order:9 },
  { slug:"ercp", title:"ERCP", eyebrow:"BILE & PANCREATIC DUCT CARE", excerpt:"Advanced endoscopic treatment for stones, strictures, leaks and obstructive jaundice.", image_url:"/assets/img/service/sr-d-3.jpg", ...common, treatments:["Bile duct stone extraction","Stent placement for selected obstruction or leaks","Planned surgery after duct clearance when needed"], recovery:"Monitoring checks for pain, fever, bleeding or pancreatitis after the procedure.", sort_order:10 },
  { slug:"laser-proctology", title:"Laser Proctology", eyebrow:"ANORECTAL CARE", excerpt:"Modern assessment and selected minimally invasive treatment for piles, fissure and fistula.", image_url:"/assets/img/service/ser8-6.jpg", ...common, treatments:["Individual treatment for piles, fissure or fistula","Laser or conventional surgery based on disease","Bowel habit and lifestyle correction"], recovery:"Pain control, stool-softening and wound care are important after treatment.", sort_order:11 },
  { slug:"emergency-gi-surgery", title:"Emergency GI Surgery", eyebrow:"URGENT SURGICAL CARE", excerpt:"Prompt assessment for perforation, obstruction, bleeding, infection and abdominal trauma.", image_url:"/assets/img/service/ser8-4.jpg", ...common, treatments:["Rapid resuscitation and imaging","Emergency laparoscopy or open surgery","Critical care and multidisciplinary support"], recovery:"Recovery depends on the emergency, infection severity and procedure required.", sort_order:12 }
];

export const articles: Article[] = [
  { slug:"digestive-warning-signs", title:"7 digestive warning signs you should never ignore", excerpt:"Persistent pain, bleeding, weight loss and bowel changes deserve timely specialist assessment.", category:"Symptoms", image_url:"/assets/img/7warning.png", reading_minutes:5, content:"Digestive symptoms are common, but persistent abdominal pain, unexplained weight loss, blood in stool, black stools, repeated vomiting, jaundice or a new bowel pattern should not be ignored.\n\nRecord when symptoms began, any food triggers, fever, medication use and previous reports. Severe pain, vomiting blood, black stools, fainting or high fever require urgent medical care.", published:true },
  { slug:"gallstones-guide", title:"Gallstones: symptoms and when surgery is needed", excerpt:"Understand painful attacks, complications and how laparoscopic gallbladder surgery is planned.", category:"Gallbladder", image_url:"/assets/img/team/gallbladder.png", reading_minutes:6, content:"Gallstones can cause right upper abdominal pain, nausea, fever or jaundice. Ultrasound and blood tests help confirm stones and identify infection or bile duct blockage.\n\nPain medicines may ease an attack but do not remove the stones. Repeated attacks or complications often need laparoscopic gallbladder removal after specialist assessment.", published:true },
  { slug:"better-gut-health", title:"Simple habits for better gut health", excerpt:"Practical routines that support digestion without restrictive trends or miracle cures.", category:"Lifestyle", image_url:"/assets/img/lifestyle.png", reading_minutes:4, content:"Regular meals, adequate water, fibre from varied foods, daily movement and good sleep support digestive health. Increase fibre gradually if your diet is currently low in it.\n\nPersistent symptoms should be assessed rather than managed with repeated self-medication.", published:true },
  { slug:"colonoscopy-screening", title:"What patients should know about colonoscopy", excerpt:"Who may need a colonoscopy, how to prepare and what happens after the procedure.", category:"Prevention", image_url:"/assets/img/service/sr-d-2.jpg", reading_minutes:5, content:"Colonoscopy may be advised for bleeding, unexplained anemia, bowel habit change, family history, polyps or cancer screening.\n\nGood bowel preparation is essential. Share blood thinner and diabetes medicine details, and arrange an attendant when sedation is planned.", published:true }
];
