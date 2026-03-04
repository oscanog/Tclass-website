export type PolicySection =
  | {
      title: string;
      body: string;
    }
  | {
      title: string;
      bullets: string[];
    };

export const policyEffectiveDate = "March 4, 2026";
export const policyContactEmail = "tclasstarlac26@gmail.com";
export const policyWebsite = "tclass.ph";

export const termsSections: PolicySection[] = [
  {
    title: "1. Acceptance of Terms",
    body:
      "By accessing and using this website, enrolling in courses, or submitting information through tclass.ph, you agree to be bound by these Terms of Service. If you do not agree, please do not use the website or our services.",
  },
  {
    title: "2. About TClass",
    body:
      "TClass is an educational and training institute based in Tarlac, Philippines, providing short courses, skills training, workshops, and related academic services.",
  },
  {
    title: "3. Use of Website",
    bullets: [
      "Provide accurate and complete information when registering or enrolling.",
      "Use the website only for lawful purposes.",
      "Do not attempt to disrupt, hack, or misuse the platform.",
      "Do not copy or distribute course materials without permission.",
      "We reserve the right to suspend or terminate access for violations of these terms.",
    ],
  },
  {
    title: "4. Enrollment & Payments",
    bullets: [
      "Course fees, schedules, and requirements are posted on the website or communicated officially.",
      "Enrollment is confirmed only upon payment and official confirmation.",
      "Fees are non-transferable unless otherwise stated.",
      "Refund policies, if applicable, will be defined per course offering.",
    ],
  },
  {
    title: "5. Intellectual Property",
    body:
      "All content on this website, including course materials, logos, branding, text, and graphics are the property of TClass and may not be reproduced without written consent.",
  },
  {
    title: "6. Limitation of Liability",
    body:
      "TClass is not liable for technical website interruptions, loss of data caused by user negligence, or indirect damages arising from course participation. All services are provided as is without guarantees of specific employment outcomes.",
  },
  {
    title: "7. Modifications",
    body:
      "We may update these Terms at any time. Continued use of the website constitutes acceptance of the revised terms.",
  },
  {
    title: "8. Governing Law",
    body: "These Terms are governed by the laws of the Republic of the Philippines.",
  },
];

export const privacySections: PolicySection[] = [
  {
    title: "1. Information We Collect",
    bullets: [
      "Full name",
      "Email address",
      "Contact number",
      "Address",
      "Educational background",
      "Payment details",
      "Website usage data via cookies",
    ],
  },
  {
    title: "2. How We Use Your Information",
    bullets: [
      "Process enrollments",
      "Communicate course updates",
      "Issue certificates",
      "Improve our services",
      "Comply with legal obligations",
      "We do not sell your personal data.",
    ],
  },
  {
    title: "3. Data Storage & Security",
    body:
      "Your data is stored securely and protected through restricted access controls, encrypted connections (SSL), and secure hosting environments. Only authorized personnel may access your information.",
  },
  {
    title: "4. Data Retention",
    body:
      "We retain personal data only as long as necessary for academic records, legal compliance, and institutional documentation. You may request data deletion subject to legal limitations.",
  },
  {
    title: "5. Your Rights",
    body: `Under the Data Privacy Act, you have the right to access your personal data, request correction, withdraw consent, and request deletion where applicable. To exercise your rights, contact us at ${policyContactEmail}.`,
  },
  {
    title: "6. Cookies",
    body:
      "We may use cookies to improve website functionality and analytics. You may disable cookies through your browser settings.",
  },
  {
    title: "7. Third-Party Services",
    body:
      "We may use third-party providers such as payment gateways and hosting services. These providers are required to maintain confidentiality and data protection standards.",
  },
  {
    title: "8. Policy Updates",
    body:
      "We may update this Privacy Policy periodically. The updated version will be posted on this page with the revised effective date.",
  },
];
