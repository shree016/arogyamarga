import type { DoctorProfile, QueuePatient } from "@/lib/types";

export const doctorProfiles: DoctorProfile[] = [
  {
    id: "doc-0",
    name: "Dr. Aarav Iyer",
    specialty: "Orthopedics",
    department: "Orthopedics",
    rating: 4.8,
    distanceKm: 2.4,
    waitMinutes: 16,
    image: "/doctors/doctor-4.svg",
    highlight: "Best Match",
  },
  {
    id: "doc-1",
    name: "Dr. Anika Rao",
    specialty: "Neurology",
    department: "Neuro Care",
    rating: 4.9,
    distanceKm: 2.1,
    waitMinutes: 18,
    image: "/doctors/doctor-1.svg",
    highlight: "Top Rated",
  },
  {
    id: "doc-2",
    name: "Dr. Rohan Mehta",
    specialty: "Internal Medicine",
    department: "General Medicine",
    rating: 4.7,
    distanceKm: 3.6,
    waitMinutes: 24,
    image: "/doctors/doctor-2.svg",
  },
  {
    id: "doc-3",
    name: "Dr. Kavya Nair",
    specialty: "Pulmonology",
    department: "Respiratory",
    rating: 4.8,
    distanceKm: 4.3,
    waitMinutes: 12,
    image: "/doctors/doctor-3.svg",
  },
  {
    id: "doc-4",
    name: "Dr. Vihaan Das",
    specialty: "Gastroenterology",
    department: "Digestive Health",
    rating: 4.6,
    distanceKm: 5.1,
    waitMinutes: 32,
    image: "/doctors/doctor-1.svg",
  },
];

export const queuePatients: QueuePatient[] = [
  {
    id: "q-1",
    name: "Asha P.",
    token: "AM-021",
    department: "General Medicine",
    status: "Waiting",
    waitMinutes: 18,
    emergency: false,
  },
  {
    id: "q-2",
    name: "Rahul K.",
    token: "AM-022",
    department: "Respiratory",
    status: "Registered",
    waitMinutes: 26,
    emergency: false,
  },
  {
    id: "q-3",
    name: "Zoya S.",
    token: "AM-023",
    department: "Neuro Care",
    status: "File With Doctor",
    waitMinutes: 6,
    emergency: false,
  },
  {
    id: "q-4",
    name: "Emergency",
    token: "EM-004",
    department: "Emergency",
    status: "Your Turn",
    waitMinutes: 0,
    emergency: true,
  },
];

export const waitTimeSeries = [
  { hour: "08:00", wait: 14 },
  { hour: "09:00", wait: 19 },
  { hour: "10:00", wait: 23 },
  { hour: "11:00", wait: 16 },
  { hour: "12:00", wait: 21 },
  { hour: "13:00", wait: 18 },
];

export const soapNotes = {
  subjective:
    "Patient reports recurring headache with sensitivity to light. No prior neuro history. Sleep has been disturbed for 2 nights.",
  objective:
    "Vitals stable. BP 122/80. Neuro exam normal. Mild sinus tenderness.",
  assessment:
    "Likely tension headache with possible sinus involvement. No red flags.",
  plan: "Recommend hydration, mild analgesics, nasal decongestant if congestion persists. Follow up in 48 hours.",
};
