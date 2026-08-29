/**
 * seed/seedData.js
 * -------------------
 * Populates MongoDB with a prototype dataset covering the priority states
 * requested for the SIH demo: Jharkhand, Rajasthan, Gujarat, Bihar, Odisha,
 * Madhya Pradesh, Maharashtra, West Bengal, Tamil Nadu, Kerala, Assam
 * (plus a handful of extra states carried over from the original prototype
 * so "Explore by Region" still has coverage everywhere).
 *
 * Every record is explicitly marked verificationStatus: "prototype" and
 * sources: ["BharatVerse prototype dataset"] — never presented as an
 * official government source. Heritage Health scores are computed through
 * the same calculateHeritageHealth() engine the API uses, so seed data and
 * live-created data are scored identically.
 *
 * Run with: npm run seed   (from backend/)
 */
require("dotenv").config();
const mongoose = require("mongoose");
const { connectDB } = require("../config/db");
const State = require("../models/State");
const Heritage = require("../models/Heritage");
const Artisan = require("../models/Artisan");
const Event = require("../models/Event");
const Story = require("../models/Story");
const Contribution = require("../models/Contribution");
const QuizQuestion = require("../models/QuizQuestion");
const QuizAttempt = require("../models/QuizAttempt");
const { calculateHeritageHealth } = require("../services/heritageRisk.service");

const PROTOTYPE_SOURCE = ["BharatVerse prototype dataset"];

const STATES = [
  {
    name: "Jharkhand", region: "East India", capital: "Ranchi",
    highlights: "Tribal wall art, Chhau masks, Sarhul spring festival and dense sal forests shape a culture rooted in nature-worship.",
    traditions: ["Sohrai Wall Painting", "Khovar Marriage Art", "Chhau Mask Making", "Sarhul Festival Rites"],
    artForms: ["Sohrai Art", "Khovar Art", "Paitkar Scroll Painting"],
    festivals: ["Sarhul", "Sohrai Festival", "Karma Festival"],
    languages: ["Hindi", "Santali", "Mundari", "Ho"],
    featuredArtisan: { name: "Budhni Devi", craft: "Sohrai Wall Painting" },
  },
  {
    name: "Rajasthan", region: "North India", capital: "Jaipur",
    highlights: "Desert forts, vivid textiles and miniature painting traditions carried by royal ateliers for centuries.",
    traditions: ["Phad Scroll Storytelling", "Puppetry (Kathputli)", "Bandhani Tie-Dye", "Fort Fresco Restoration"],
    artForms: ["Blue Pottery", "Miniature Painting", "Bandhani Textile"],
    festivals: ["Pushkar Camel Fair", "Teej", "Gangaur"],
    languages: ["Hindi", "Rajasthani", "Marwari"],
    featuredArtisan: { name: "Ram Lal Joshi", craft: "Phad Painting" },
  },
  {
    name: "Gujarat", region: "West India", capital: "Gandhinagar",
    highlights: "A trading heartland where mirror-work embroidery, block printing and garba rhythms define daily life.",
    traditions: ["Rabari Embroidery", "Bandhani Craft", "Garba Dance Circles", "Patola Weaving Rituals"],
    artForms: ["Patola Silk Weaving", "Bandhani", "Mirror-work Embroidery"],
    festivals: ["Navratri", "Rann Utsav", "Kite Festival (Uttarayan)"],
    languages: ["Gujarati", "Hindi", "Kutchi"],
    featuredArtisan: { name: "Salemamad Khatri", craft: "Patola Weaving" },
  },
  {
    name: "Bihar", region: "East India", capital: "Patna",
    highlights: "The Mithila cultural belt, birthplace of Madhubani painting and centuries-old riverine harvest rites.",
    traditions: ["Madhubani Wall Painting", "Chhath Puja Rituals", "Sikki Grass Craft", "Sujani Embroidery"],
    artForms: ["Madhubani Painting", "Sikki Grass Weaving"],
    festivals: ["Chhath Puja", "Sonepur Mela", "Vivah Panchami"],
    languages: ["Hindi", "Bhojpuri", "Maithili"],
    featuredArtisan: { name: "Sita Devi", craft: "Madhubani Painting" },
  },
  {
    name: "Odisha", region: "East India", capital: "Bhubaneswar",
    highlights: "Temple towns and coastal groves where classical dance and palm-leaf scripture merge with tribal art.",
    traditions: ["Jagannath Temple Rituals", "Palm-Leaf Manuscript Etching", "Sand Art of Puri", "Sambalpuri Weaving"],
    artForms: ["Pattachitra (Odisha)", "Sambalpuri Ikat", "Palm-Leaf Engraving"],
    festivals: ["Rath Yatra", "Konark Dance Festival", "Nuakhai"],
    languages: ["Odia", "Hindi"],
    featuredArtisan: { name: "Bhaskar Mahapatra", craft: "Pattachitra Painting" },
  },
  {
    name: "Madhya Pradesh", region: "Central India", capital: "Bhopal",
    highlights: "India's tribal heartland, home to Gond painting, ancient cave art and the Narmada's riverine festivals.",
    traditions: ["Gond Painting", "Bagh Print Textile", "Bhil Tribal Art", "Narmada Parikrama Rituals"],
    artForms: ["Gond Art", "Bagh Hand-Block Printing"],
    festivals: ["Bhagoria Haat", "Khajuraho Dance Festival", "Navratri"],
    languages: ["Hindi", "Gondi", "Bhili"],
    featuredArtisan: { name: "Jangarh Kalam Jr.", craft: "Gond Painting" },
  },
  {
    name: "Maharashtra", region: "West India", capital: "Mumbai",
    highlights: "From cave-temple sculpture to Warli's dotted forests, a state layered with ancient and folk traditions.",
    traditions: ["Warli Wall Painting", "Lavani Performance", "Ganesh Chaturthi Idol-Making", "Paithani Weaving"],
    artForms: ["Warli Art", "Paithani Sari Weaving", "Bidri-inspired Metalwork"],
    festivals: ["Ganesh Chaturthi", "Gudi Padwa", "Nagpanchami"],
    languages: ["Marathi", "Hindi"],
    featuredArtisan: { name: "Jivya Soma Mashe Jr.", craft: "Warli Painting" },
  },
  {
    name: "West Bengal", region: "East India", capital: "Kolkata",
    highlights: "River-delta culture of terracotta temples, Baul mysticism and the grand civic art of Durga Puja.",
    traditions: ["Durga Puja Pandal Art", "Baul Minstrel Singing", "Terracotta Temple Carving", "Kantha Stitching"],
    artForms: ["Kantha Embroidery", "Terracotta Art", "Patachitra (Bengal)"],
    festivals: ["Durga Puja", "Poila Boishakh", "Rath Yatra"],
    languages: ["Bengali", "Hindi"],
    featuredArtisan: { name: "Anjali Chitrakar", craft: "Bengal Patachitra" },
  },
  {
    name: "Tamil Nadu", region: "South India", capital: "Chennai",
    highlights: "Bronze-casting temple towns and a classical dance heritage that stretches back over a millennium.",
    traditions: ["Bharatanatyam Practice", "Bronze Idol Casting", "Kolam Floor Art", "Tanjore Painting Gilding"],
    artForms: ["Tanjore Painting", "Bronze Casting (Chola technique)", "Kolam Art"],
    festivals: ["Pongal", "Chithirai Festival", "Natyanjali Dance Festival"],
    languages: ["Tamil", "English"],
    featuredArtisan: { name: "Meenakshi Sundaram", craft: "Tanjore Painting" },
  },
  {
    name: "Kerala", region: "South India", capital: "Thiruvananthapuram",
    highlights: "Backwater villages and temple courtyards where classical dance-drama and boat-racing rituals thrive.",
    traditions: ["Kathakali Performance", "Snake Boat Racing", "Theyyam Ritual Dance", "Coir Craft"],
    artForms: ["Kathakali Masks & Makeup", "Mural Painting (Kerala)", "Coir Weaving"],
    festivals: ["Onam", "Thrissur Pooram", "Vallam Kali"],
    languages: ["Malayalam", "English"],
    featuredArtisan: { name: "Krishnan Namboothiri", craft: "Kathakali Mask Making" },
  },
  {
    name: "Assam", region: "Northeast India", capital: "Guwahati",
    highlights: "Tea-garden hills and river valleys where bamboo craft and Bihu rhythms mark every harvest season.",
    traditions: ["Bihu Dance", "Muga Silk Weaving", "Bamboo Craft", "Mask-Making of Majuli"],
    artForms: ["Muga Silk Weaving", "Majuli Mask Art", "Bamboo & Cane Craft"],
    festivals: ["Bihu", "Ambubachi Mela", "Majuli Festival"],
    languages: ["Assamese", "Bodo", "Hindi"],
    featuredArtisan: { name: "Hemanta Borah", craft: "Majuli Mask Making" },
  },
];

// Heritage records: TRADITIONS from the original prototype, now upgraded
// with real Heritage Health indicators (illustrative, prototype numbers —
// see services/heritageRisk.service.js for the transparent methodology).
const HERITAGE = [
  {
    name: "Sohrai Art", category: "Art", state: "Jharkhand", region: "East India", district: "Hazaribagh",
    description: "A tribal harvest-season wall painting tradition applied directly onto mud walls.",
    history: "Sohrai wall painting is created by Jharkhand's tribal communities during the harvest season, using natural pigments applied with fingers, twigs and chewed cloth swabs directly onto mud walls.",
    significance: "The murals celebrate cattle, harvest and fertility, and are believed to invite prosperity into the home.",
    materials: "Natural ochre, charcoal, chalk, and locally sourced clay pigments.",
    techniques: "Walls are prepared with layers of natural clay, then comb-scraped and painted in geometric and animal motifs.",
    languages: ["Hindi", "Santali"], festivals: ["Sohrai Festival"],
    coordinates: { lat: 23.9925, lng: 85.3637 },
    healthIndicators: { documentation: 82, practitionerBase: 61, youthParticipation: 48, practiceFrequency: 58, economicViability: 55, communityParticipation: 64 },
  },
  {
    name: "Madhubani Painting", category: "Art", state: "Bihar", region: "East India", district: "Madhubani",
    description: "Traditionally painted by women on mud walls and floors for festivals and weddings.",
    history: "Originating in the Mithila region, Madhubani painting was traditionally done by women on freshly plastered mud walls and floors for festivals and weddings.",
    significance: "Depicts deities, nature and courtly scenes, often symbolising fertility, prosperity and devotion.",
    materials: "Cow dung and mud base, natural dyes from turmeric, indigo and flower pigments.",
    techniques: "Double-line borders are drawn first and filled with intricate patterns, with no blank space left.",
    languages: ["Hindi", "Maithili"], festivals: ["Chhath Puja", "Vivah Panchami"],
    coordinates: { lat: 26.3556, lng: 86.0725 },
    healthIndicators: { documentation: 88, practitionerBase: 74, youthParticipation: 66, practiceFrequency: 70, economicViability: 68, communityParticipation: 80 },
  },
  {
    name: "Kathakali", category: "Dance", state: "Kerala", region: "South India", district: "Thrissur",
    description: "A classical dance-drama combining literature, music, painted faces and elaborate costume.",
    history: "A classical dance-drama dating to the 17th century, combining literature, music, painted faces and elaborate costume to enact Hindu epics.",
    significance: "Performers train for years to master facial expressions (navarasa) that convey complex emotion without words.",
    materials: "Rice paste, natural pigments, coconut-shell eye extensions, layered costume.",
    techniques: "Performances begin with hours of face painting, followed by percussion-driven storytelling through gesture.",
    languages: ["Malayalam"], festivals: ["Thrissur Pooram"],
    coordinates: { lat: 10.5276, lng: 76.2144 },
    healthIndicators: { documentation: 91, practitionerBase: 70, youthParticipation: 62, practiceFrequency: 75, economicViability: 60, communityParticipation: 78 },
  },
  {
    name: "Pattachitra", category: "Art", state: "Odisha", region: "East India", district: "Puri",
    description: "An ancient cloth-scroll painting tradition tied to Odisha's Jagannath temple.",
    history: "An ancient cloth-scroll painting tradition tied to Odisha's Jagannath temple, dating back over a thousand years.",
    significance: "Depicts mythological narratives and is traditionally created to accompany temple rituals and festivals.",
    materials: "Cotton cloth, tamarind seed glue, natural stone and mineral pigments.",
    techniques: "Cloth is treated with tamarind paste and chalk, then painted and finished with a lacquer coating.",
    languages: ["Odia"], festivals: ["Rath Yatra"],
    coordinates: { lat: 19.8135, lng: 85.8312 },
    healthIndicators: { documentation: 85, practitionerBase: 58, youthParticipation: 45, practiceFrequency: 60, economicViability: 62, communityParticipation: 70 },
  },
  {
    name: "Warli Painting", category: "Art", state: "Maharashtra", region: "West India", district: "Palghar",
    description: "Practiced by the Warli tribe for over 2,500 years, using simple geometric shapes.",
    history: "Practiced by the Warli tribe for over 2,500 years, using simple geometric shapes to depict daily and ritual life.",
    significance: "Circles, triangles and squares represent the sun, mountains and earth, connecting art to nature-worship.",
    materials: "Rice paste, gum, bamboo sticks, ochre-toned mud walls.",
    techniques: "White rice-paste paint is applied with a bamboo stick onto a mud base tinted with red ochre.",
    languages: ["Marathi"], festivals: ["Warli Harvest Rituals"],
    coordinates: { lat: 19.6967, lng: 72.7654 },
    healthIndicators: { documentation: 80, practitionerBase: 52, youthParticipation: 40, practiceFrequency: 50, economicViability: 58, communityParticipation: 60 },
  },
  {
    name: "Bihu Dance", category: "Dance", state: "Assam", region: "Northeast India", district: "Guwahati",
    description: "A vibrant folk dance performed during the Bihu harvest festivals.",
    history: "A vibrant folk dance performed during the Bihu harvest festivals, marking the Assamese New Year and agricultural cycles.",
    significance: "Celebrates youth, fertility and the harvest, performed communally with drums and traditional attire.",
    materials: "Mekhela chador attire, dhol drums, pepa horn.",
    techniques: "Dancers move in fast rhythmic steps to dhol and pepa (buffalo-horn pipe), often in open fields.",
    languages: ["Assamese"], festivals: ["Bihu"],
    coordinates: { lat: 26.1445, lng: 91.7362 },
    healthIndicators: { documentation: 78, practitionerBase: 80, youthParticipation: 85, practiceFrequency: 88, economicViability: 55, communityParticipation: 90 },
  },
  {
    name: "Kolam Floor Art", category: "Art", state: "Tamil Nadu", region: "South India", district: "Chennai",
    description: "A daily ritual floor drawing made by women at dawn using rice flour.",
    history: "A daily ritual floor drawing made by women at dawn using rice flour, believed to invite prosperity and feed small creatures.",
    significance: "Symbolises hospitality, auspiciousness and the impermanence of beauty as designs fade through the day.",
    materials: "Rice flour, chalk powder, natural colour powders for festival kolams.",
    techniques: "Dots are placed in a grid and connected with continuous looping lines using rice flour between the fingers.",
    languages: ["Tamil"], festivals: ["Pongal", "Margazhi season"],
    coordinates: { lat: 13.0827, lng: 80.2707 },
    healthIndicators: { documentation: 70, practitionerBase: 90, youthParticipation: 72, practiceFrequency: 95, economicViability: 30, communityParticipation: 92 },
  },
  {
    name: "Phad Painting", category: "Art", state: "Rajasthan", region: "North India", district: "Bhilwara",
    description: "A scroll-painting tradition used by travelling Bhopa priest-singers.",
    history: "A scroll-painting tradition used by travelling Bhopa priest-singers to narrate the epics of folk deities.",
    significance: "The scroll itself is treated as a mobile shrine, unrolled during night-long musical narrations.",
    materials: "Cotton cloth, starch, natural and mineral pigments.",
    techniques: "Cloth is stiffened with starch, sketched in outline, then filled with flat mineral colours in a fixed sequence.",
    languages: ["Hindi", "Rajasthani"], festivals: ["Pabuji Ki Phad Recitals"],
    coordinates: { lat: 25.3407, lng: 74.6313 },
    healthIndicators: { documentation: 74, practitionerBase: 40, youthParticipation: 28, practiceFrequency: 35, economicViability: 45, communityParticipation: 50 },
  },
  {
    name: "Gond Painting", category: "Art", state: "Madhya Pradesh", region: "Central India", district: "Bhopal",
    description: "A tribal art form of the Gond people, traditionally painted on mud walls and floors.",
    history: "A tribal art form of the Gond people, traditionally painted on mud walls and floors to mark festivals and rites of passage.",
    significance: "Depicts nature, animals and folklore using dense dot-and-line patterning believed to bring good fortune.",
    materials: "Natural pigments from charcoal, cow dung, coloured soil and plant sap.",
    techniques: "Fine dots and dashes are built up in layers to fill figurative outlines.",
    languages: ["Hindi", "Gondi"], festivals: ["Bhagoria Haat"],
    coordinates: { lat: 23.2599, lng: 77.4126 },
    healthIndicators: { documentation: 76, practitionerBase: 55, youthParticipation: 50, practiceFrequency: 55, economicViability: 65, communityParticipation: 58 },
  },
  {
    name: "Bandhani Tie-Dye", category: "Craft", state: "Gujarat", region: "West India", district: "Kutch",
    description: "A resist-dye textile craft producing dotted patterns across silk and cotton.",
    history: "Bandhani has been practiced in Gujarat and Rajasthan for centuries, historically tied to Khatri artisan lineages.",
    significance: "Bandhani textiles mark weddings, births and festivals across Gujarati and Rajasthani households.",
    materials: "Cotton or silk cloth, natural and synthetic dyes, cotton thread for tying.",
    techniques: "Cloth is pinched and tied into thousands of tiny knots before dyeing to resist colour in a pattern.",
    languages: ["Gujarati", "Kutchi"], festivals: ["Navratri"],
    coordinates: { lat: 23.242, lng: 69.6669 },
    healthIndicators: { documentation: 72, practitionerBase: 62, youthParticipation: 44, practiceFrequency: 68, economicViability: 70, communityParticipation: 60 },
  },
  {
    name: "Durga Puja Pandal Art", category: "Festival", state: "West Bengal", region: "East India", district: "Kolkata",
    description: "Grand civic art installations (pandals) and processions honouring Goddess Durga.",
    history: "Durga Puja pandal-making has grown from a domestic ritual into large-scale civic art installations across Kolkata since the mid-20th century.",
    significance: "Recognised by UNESCO as Intangible Cultural Heritage; brings together sculptors, lighting designers and local committees.",
    materials: "Clay, bamboo, jute, fabric, lighting.",
    techniques: "Clay idols are hand-modelled over straw-and-bamboo frames, then painted and dressed before elaborate pandal installation.",
    languages: ["Bengali"], festivals: ["Durga Puja"],
    coordinates: { lat: 22.5726, lng: 88.3639 },
    healthIndicators: { documentation: 90, practitionerBase: 75, youthParticipation: 70, practiceFrequency: 60, economicViability: 82, communityParticipation: 95 },
  },
];

const ARTISANS = [
  { name: "Budhni Devi", craft: "Sohrai Wall Painting", state: "Jharkhand", district: "Hazaribagh", community: "Kurmi Artisan Collective",
    story: "Budhni Devi learned Sohrai painting from her grandmother, mixing pigments from the same riverbank clay her family has used for three generations.",
    skills: ["Wall preparation", "Natural pigment mixing", "Freehand animal motifs"] },
  { name: "Ram Lal Joshi", craft: "Phad Scroll Painting", state: "Rajasthan", district: "Bhilwara", community: "Joshi Family Artisans",
    story: "The fifth generation of Bhopa scroll painters, Ram Lal still travels with musicians to perform night-long recitations of the Phad scrolls he paints.",
    skills: ["Scroll sketching", "Mineral pigment application", "Bhopa recitation"] },
  { name: "Bhaskar Mahapatra", craft: "Pattachitra Painting", state: "Odisha", district: "Puri", community: "Raghurajpur Artisan Village",
    story: "Bhaskar grew up in Raghurajpur's heritage crafts village, where nearly every household paints Pattachitra scrolls for the Jagannath temple.",
    skills: ["Cloth treatment", "Mineral pigment painting", "Lacquer finishing"] },
  { name: "Krishnan Namboothiri", craft: "Kathakali Mask & Makeup", state: "Kerala", district: "Thrissur", community: "Kalamandalam Performing Troupes",
    story: "Krishnan trains young Kathakali performers in the demanding art of facial makeup that can take over three hours to apply.",
    skills: ["Chutti facial structuring", "Natural pigment application", "Performer training"] },
  { name: "Sita Devi", craft: "Madhubani Painting", state: "Bihar", district: "Madhubani", community: "Mithila Women Artisan Groups",
    story: "Sita Devi paints the same courtyard walls her mother once did, now training young women in her village to carry the tradition into digital archives.",
    skills: ["Double-line border drawing", "Natural dye preparation", "Mentorship"] },
];

const EVENTS = [
  { name: "Sarhul Festival", state: "Jharkhand", date: new Date("2026-03-24"), location: "Ranchi & surrounding villages", category: "Festival", status: "upcoming", description: "A spring festival marking the blossoming of the sal tree, celebrated with tribal dance and worship." },
  { name: "Pushkar Camel Fair", state: "Rajasthan", date: new Date("2026-11-14"), location: "Pushkar, Rajasthan", category: "Festival", status: "upcoming", description: "One of the world's largest camel and livestock fairs, paired with folk music and craft stalls." },
  { name: "Navratri Garba Nights", state: "Gujarat", date: new Date("2026-10-03"), location: "Ahmedabad, Gujarat", category: "Festival", status: "upcoming", description: "Nine nights of garba and dandiya dance circles across Gujarat's cities and villages." },
  { name: "Durga Puja", state: "West Bengal", date: new Date("2026-10-18"), location: "Kolkata, West Bengal", category: "Festival", status: "upcoming", description: "Grand civic art installations (pandals) and processions honouring Goddess Durga." },
  { name: "Rath Yatra", state: "Odisha", date: new Date("2026-07-05"), location: "Puri, Odisha", category: "Festival", status: "upcoming", description: "The chariot festival of Lord Jagannath, drawing millions of pilgrims to Puri." },
  { name: "Onam", state: "Kerala", date: new Date("2026-08-26"), location: "Statewide, Kerala", category: "Festival", status: "recent", description: "Kerala's harvest festival, marked by snake-boat races and floral kolam art." },
  { name: "Bihu", state: "Assam", date: new Date("2026-04-14"), location: "Statewide, Assam", category: "Festival", status: "upcoming", description: "The Assamese New Year and harvest festival, celebrated with Bihu dance." },
  { name: "Sohrai Documentation Drive", state: "Jharkhand", date: new Date("2026-09-10"), location: "Hazaribagh, Jharkhand", category: "Documentation Drive", status: "live", description: "A live community documentation effort to photograph and record Sohrai wall art before the monsoon repaint season." },
];

const STORIES = [
  { title: "The Cattle that Painted the Walls", location: "Jharkhand", state: "Jharkhand", language: "English",
    description: "A Sohrai legend on why the harvest moon calls artists to the walls of their homes.",
    transcript: "This is a placeholder transcript for the prototype. A production build would attach a real transcribed oral history here.",
    isDemoAudio: true },
  { title: "The Scroll that Sang at Night", location: "Rajasthan", state: "Rajasthan", language: "English",
    description: "How Bhopa singers carried entire epics across the desert, rolled inside a single cloth.",
    transcript: "This is a placeholder transcript for the prototype. A production build would attach a real transcribed oral history here.",
    isDemoAudio: true },
  { title: "The Fisherman's Boat Race", location: "Kerala", state: "Kerala", language: "English",
    description: "The origin story behind Kerala's thunderous snake-boat races on the backwaters.",
    transcript: "This is a placeholder transcript for the prototype. A production build would attach a real transcribed oral history here.",
    isDemoAudio: true },
];

// Heritage Quiz — 15 curated questions across the priority states/categories.
// `heritageName` is used only at seed time to link relatedHeritage; it is
// not a schema field and is stripped before insertion.
const QUIZ_QUESTIONS = [
  { question: "Sohrai wall painting is traditionally practised by tribal communities of which state?", options: ["Jharkhand", "Punjab", "Kerala", "Gujarat"], correctIndex: 0, category: "Art", state: "Jharkhand", difficulty: "easy", heritageName: "Sohrai Art", explanation: "Sohrai is painted by Kurmi, Santhal and Oraon communities in Jharkhand during the harvest season." },
  { question: "What is used to apply pigment in traditional Sohrai painting?", options: ["Fingers, twigs and cloth swabs", "A fine sable brush", "An airbrush", "Printing blocks"], correctIndex: 0, category: "Art", state: "Jharkhand", difficulty: "medium", heritageName: "Sohrai Art", explanation: "Sohrai artists apply natural pigment with fingers, twigs and chewed cloth swabs directly onto mud walls." },
  { question: "Madhubani painting originates from the Mithila region of which state?", options: ["Bihar", "Assam", "Odisha", "Rajasthan"], correctIndex: 0, category: "Art", state: "Bihar", difficulty: "easy", heritageName: "Madhubani Painting", explanation: "Madhubani takes its name from the Madhubani district in Bihar's Mithila region." },
  { question: "In Madhubani painting, what is drawn first before filling in a design?", options: ["A double-line border", "A single dot grid", "The signature", "The background colour"], correctIndex: 0, category: "Art", state: "Bihar", difficulty: "medium", heritageName: "Madhubani Painting", explanation: "Artists draw a double-line border first, then fill every space with pattern — no blank space is left." },
  { question: "Kathakali is a classical dance-drama form native to which state?", options: ["Kerala", "Tamil Nadu", "West Bengal", "Maharashtra"], correctIndex: 0, category: "Dance", state: "Kerala", difficulty: "easy", heritageName: "Kathakali", explanation: "Kathakali developed in Kerala, combining literature, percussion and elaborate face makeup." },
  { question: "Kathakali performers train for years to master which expressive skill?", options: ["Navarasa (nine facial emotions)", "Sword fighting", "Sanskrit chanting", "Puppet control"], correctIndex: 0, category: "Dance", state: "Kerala", difficulty: "hard", heritageName: "Kathakali", explanation: "Navarasa refers to the nine core emotions Kathakali performers express almost entirely through the face." },
  { question: "Pattachitra cloth-scroll painting is closely tied to which temple town?", options: ["Puri, Odisha", "Varanasi, Uttar Pradesh", "Madurai, Tamil Nadu", "Dwarka, Gujarat"], correctIndex: 0, category: "Art", state: "Odisha", difficulty: "medium", heritageName: "Pattachitra", explanation: "Pattachitra scrolls traditionally accompany rituals at the Jagannath Temple in Puri, Odisha." },
  { question: "What is cotton cloth treated with before Pattachitra painting begins?", options: ["Tamarind seed glue and chalk", "Coconut oil", "Beeswax", "Turmeric paste"], correctIndex: 0, category: "Art", state: "Odisha", difficulty: "hard", heritageName: "Pattachitra", explanation: "Cloth is treated with tamarind paste and chalk to create a stiff, paintable surface before pigments are applied." },
  { question: "Warli painting traditionally uses which material to create its white pigment?", options: ["Rice paste", "Turmeric", "Indigo", "Charcoal"], correctIndex: 0, category: "Art", state: "Maharashtra", difficulty: "easy", heritageName: "Warli Painting", explanation: "Warli artists paint with white rice-paste onto an ochre-toned mud wall." },
  { question: "Warli geometric motifs (circles, triangles, squares) most commonly represent what?", options: ["The sun, mountains and earth", "Musical notes", "Numbers and counting", "Zodiac signs"], correctIndex: 0, category: "Art", state: "Maharashtra", difficulty: "medium", heritageName: "Warli Painting", explanation: "Warli's basic shapes connect the art to nature-worship — circles for the sun/moon, triangles for mountains." },
  { question: "Bihu dance is performed to celebrate which occasion in Assam?", options: ["The Assamese New Year and harvest", "Diwali", "The monsoon's arrival", "Republic Day"], correctIndex: 0, category: "Dance", state: "Assam", difficulty: "easy", heritageName: "Bihu Dance", explanation: "Bihu marks the Assamese New Year and the agricultural cycle, danced to dhol and pepa horn." },
  { question: "Kolam floor art is traditionally drawn using which material?", options: ["Rice flour", "Chalk paint", "Sand only", "Flower petals only"], correctIndex: 0, category: "Art", state: "Tamil Nadu", difficulty: "easy", heritageName: "Kolam Floor Art", explanation: "Kolams are drawn each dawn with rice flour, partly so the design can feed small creatures through the day." },
  { question: "Phad scroll paintings from Rajasthan are traditionally used for what purpose?", options: ["Night-long musical narrations by Bhopa singers", "Wedding invitations", "Temple entry tickets", "Land ownership records"], correctIndex: 0, category: "Art", state: "Rajasthan", difficulty: "medium", heritageName: "Phad Painting", explanation: "Bhopa priest-singers unroll Phad scrolls as a mobile shrine during night-long recitations of folk epics." },
  { question: "Gond painting's dense dot-and-line style is associated with which community?", options: ["The Gond tribal people of central India", "Coastal fishing communities", "Himalayan Buddhist monasteries", "Royal court painters of Rajasthan"], correctIndex: 0, category: "Art", state: "Madhya Pradesh", difficulty: "easy", heritageName: "Gond Painting", explanation: "Gond painting is a tribal art form of the Gond people, traditionally marking festivals and rites of passage." },
  { question: "Durga Puja pandal-making in Kolkata has been recognised by which international body?", options: ["UNESCO (Intangible Cultural Heritage)", "WHO", "FIFA", "UNICEF"], correctIndex: 0, category: "Festival", state: "West Bengal", difficulty: "hard", heritageName: "Durga Puja Pandal Art", explanation: "UNESCO inscribed Kolkata's Durga Puja on its Representative List of Intangible Cultural Heritage in 2021." },
];

async function seed() {
  await connectDB();
  if (mongoose.connection.readyState !== 1) {
    console.error("\n[seed] Could not connect to MongoDB — check MONGO_URI in your .env file.\n");
    process.exit(1);
  }

  console.log("[seed] Clearing existing prototype collections...");
  await Promise.all([
    State.deleteMany({}),
    Heritage.deleteMany({}),
    Artisan.deleteMany({}),
    Event.deleteMany({}),
    Story.deleteMany({}),
    QuizQuestion.deleteMany({}),
    QuizAttempt.deleteMany({}),
  ]);

  console.log("[seed] Inserting states...");
  await State.insertMany(
    STATES.map((s) => ({ ...s, verificationStatus: "prototype", sources: PROTOTYPE_SOURCE }))
  );

  console.log("[seed] Inserting heritage records with computed Heritage Health...");
  const heritageDocs = HERITAGE.map((h) => {
    const health = calculateHeritageHealth(h.healthIndicators);
    return {
      ...h,
      healthScore: health.score,
      healthStatus: health.status,
      healthExplanation: health.explanation,
      verificationStatus: "prototype",
      sources: PROTOTYPE_SOURCE,
      lastUpdated: new Date(),
    };
  });
  const insertedHeritage = await Heritage.insertMany(heritageDocs);
  const heritageIdByName = new Map(insertedHeritage.map((h) => [h.name, h._id]));

  console.log("[seed] Inserting artisans...");
  await Artisan.insertMany(
    ARTISANS.map((a) => ({
      ...a,
      isPrototypeProfile: true,
      verificationStatus: "prototype",
      consentStatus: "not_applicable",
    }))
  );

  console.log("[seed] Inserting events...");
  await Event.insertMany(EVENTS.map((e) => ({ ...e, isPrototypeData: true, source: "Prototype Event Data" })));

  console.log("[seed] Inserting stories...");
  await Story.insertMany(
    STORIES.map((s) => ({ ...s, verificationStatus: "prototype", sources: PROTOTYPE_SOURCE }))
  );

  console.log("[seed] Inserting Heritage Quiz questions...");
  await QuizQuestion.insertMany(
    QUIZ_QUESTIONS.map(({ heritageName, ...q }) => ({
      ...q,
      relatedHeritage: heritageIdByName.get(heritageName),
      verificationStatus: "prototype",
      sources: PROTOTYPE_SOURCE,
    }))
  );

  console.log("\n[seed] Done.");
  console.log(`  States:    ${STATES.length}`);
  console.log(`  Heritage:  ${HERITAGE.length}`);
  console.log(`  Artisans:  ${ARTISANS.length}`);
  console.log(`  Events:    ${EVENTS.length}`);
  console.log(`  Stories:   ${STORIES.length}`);
  console.log(`  Quiz Qs:   ${QUIZ_QUESTIONS.length}`);
  console.log("\nAll records are tagged verificationStatus: 'prototype' — see README for the verification workflow.\n");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});
