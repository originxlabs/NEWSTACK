// Geographic Hierarchy Data Structure
// World → Continents → Countries → States → Cities → Localities
// Data based on 7 continents: Asia (48), Africa (54), Europe (44), North America (23), South America (12), Oceania (14), Antarctica (0)

export interface Locality {
  id: string;
  name: string;
  type: "capital" | "hub" | "district" | "area";
}

export interface City {
  id: string;
  name: string;
  isCapital?: boolean;
  localities: Locality[];
}

export interface State {
  id: string;
  name: string;
  code?: string;
  cities: City[];
}

export interface Country {
  id: string;
  name: string;
  code: string; // ISO 2-letter code
  flag: string;
  states: State[];
}

export interface Continent {
  id: string;
  name: string;
  countries: Country[];
}

// Complete India States and Cities Data
const INDIA_STATES: State[] = [
  {
    id: "ap",
    name: "Andhra Pradesh",
    code: "AP",
    cities: [
      { id: "amaravati", name: "Amaravati", isCapital: true, localities: [{ id: "amaravati-city", name: "City Center", type: "capital" }] },
      { id: "visakhapatnam", name: "Visakhapatnam", localities: [{ id: "vizag-port", name: "Port Area", type: "hub" }, { id: "mvp-colony", name: "MVP Colony", type: "district" }] },
      { id: "vijayawada", name: "Vijayawada", localities: [{ id: "auto-nagar", name: "Auto Nagar", type: "hub" }] },
      { id: "tirupati", name: "Tirupati", localities: [{ id: "tirumala", name: "Tirumala", type: "hub" }] },
      { id: "guntur", name: "Guntur", localities: [] },
      { id: "nellore", name: "Nellore", localities: [] },
      { id: "kurnool", name: "Kurnool", localities: [] },
      { id: "rajahmundry", name: "Rajahmundry", localities: [] },
      { id: "kakinada", name: "Kakinada", localities: [] },
    ],
  },
  {
    id: "ar",
    name: "Arunachal Pradesh",
    code: "AR",
    cities: [
      { id: "itanagar", name: "Itanagar", isCapital: true, localities: [{ id: "itanagar-center", name: "City Center", type: "capital" }] },
      { id: "naharlagun", name: "Naharlagun", localities: [] },
      { id: "pasighat", name: "Pasighat", localities: [] },
    ],
  },
  {
    id: "as",
    name: "Assam",
    code: "AS",
    cities: [
      { id: "dispur", name: "Dispur", isCapital: true, localities: [{ id: "dispur-secretariat", name: "Secretariat Area", type: "capital" }] },
      { id: "guwahati", name: "Guwahati", localities: [{ id: "ghy-commerce", name: "Commerce Area", type: "hub" }, { id: "pan-bazar", name: "Pan Bazar", type: "district" }] },
      { id: "silchar", name: "Silchar", localities: [] },
      { id: "dibrugarh", name: "Dibrugarh", localities: [] },
      { id: "jorhat", name: "Jorhat", localities: [] },
      { id: "tezpur", name: "Tezpur", localities: [] },
    ],
  },
  {
    id: "br",
    name: "Bihar",
    code: "BR",
    cities: [
      { id: "patna", name: "Patna", isCapital: true, localities: [{ id: "patna-secretariat", name: "Secretariat", type: "capital" }, { id: "boring-road", name: "Boring Road", type: "hub" }] },
      { id: "gaya", name: "Gaya", localities: [{ id: "bodh-gaya", name: "Bodh Gaya", type: "hub" }] },
      { id: "muzaffarpur", name: "Muzaffarpur", localities: [] },
      { id: "bhagalpur", name: "Bhagalpur", localities: [] },
      { id: "darbhanga", name: "Darbhanga", localities: [] },
      { id: "purnia", name: "Purnia", localities: [] },
    ],
  },
  {
    id: "cg",
    name: "Chhattisgarh",
    code: "CG",
    cities: [
      { id: "raipur", name: "Raipur", isCapital: true, localities: [{ id: "raipur-center", name: "City Center", type: "capital" }] },
      { id: "bhilai", name: "Bhilai", localities: [{ id: "bhilai-steel", name: "Steel Plant Area", type: "hub" }] },
      { id: "bilaspur", name: "Bilaspur", localities: [] },
      { id: "korba", name: "Korba", localities: [] },
      { id: "durg", name: "Durg", localities: [] },
    ],
  },
  {
    id: "ga",
    name: "Goa",
    code: "GA",
    cities: [
      { id: "panaji", name: "Panaji", isCapital: true, localities: [{ id: "panaji-center", name: "City Center", type: "capital" }] },
      { id: "margao", name: "Margao", localities: [] },
      { id: "vasco", name: "Vasco da Gama", localities: [{ id: "mormugao", name: "Mormugao Port", type: "hub" }] },
      { id: "mapusa", name: "Mapusa", localities: [] },
    ],
  },
  {
    id: "gj",
    name: "Gujarat",
    code: "GJ",
    cities: [
      { id: "gandhinagar", name: "Gandhinagar", isCapital: true, localities: [{ id: "gift-city", name: "GIFT City", type: "hub" }, { id: "gn-secretariat", name: "Secretariat", type: "capital" }] },
      { id: "ahmedabad", name: "Ahmedabad", localities: [{ id: "sg-highway", name: "SG Highway", type: "hub" }, { id: "cg-road", name: "CG Road", type: "district" }, { id: "ashram-road", name: "Ashram Road", type: "hub" }] },
      { id: "surat", name: "Surat", localities: [{ id: "surat-diamond", name: "Diamond Market", type: "hub" }] },
      { id: "vadodara", name: "Vadodara", localities: [{ id: "alkapuri", name: "Alkapuri", type: "hub" }] },
      { id: "rajkot", name: "Rajkot", localities: [] },
      { id: "bhavnagar", name: "Bhavnagar", localities: [] },
      { id: "jamnagar", name: "Jamnagar", localities: [] },
      { id: "junagadh", name: "Junagadh", localities: [] },
    ],
  },
  {
    id: "hr",
    name: "Haryana",
    code: "HR",
    cities: [
      { id: "chandigarh-hr", name: "Chandigarh", isCapital: true, localities: [{ id: "chd-sector17", name: "Sector 17", type: "hub" }] },
      { id: "gurugram", name: "Gurugram", localities: [{ id: "cybercity", name: "Cyber City", type: "hub" }, { id: "golf-course", name: "Golf Course Road", type: "hub" }, { id: "dlf", name: "DLF Phase", type: "district" }, { id: "mg-road-ggn", name: "MG Road", type: "district" }] },
      { id: "faridabad", name: "Faridabad", localities: [{ id: "ballabgarh", name: "Ballabgarh", type: "district" }] },
      { id: "panipat", name: "Panipat", localities: [] },
      { id: "ambala", name: "Ambala", localities: [] },
      { id: "karnal", name: "Karnal", localities: [] },
      { id: "rohtak", name: "Rohtak", localities: [] },
      { id: "hisar", name: "Hisar", localities: [] },
    ],
  },
  {
    id: "hp",
    name: "Himachal Pradesh",
    code: "HP",
    cities: [
      { id: "shimla", name: "Shimla", isCapital: true, localities: [{ id: "mall-road-shimla", name: "Mall Road", type: "hub" }] },
      { id: "dharamshala", name: "Dharamshala", localities: [{ id: "mcleodganj", name: "McLeodganj", type: "hub" }] },
      { id: "manali", name: "Manali", localities: [] },
      { id: "solan", name: "Solan", localities: [] },
      { id: "kullu", name: "Kullu", localities: [] },
    ],
  },
  {
    id: "jh",
    name: "Jharkhand",
    code: "JH",
    cities: [
      { id: "ranchi", name: "Ranchi", isCapital: true, localities: [{ id: "ranchi-main", name: "Main Road", type: "capital" }] },
      { id: "jamshedpur", name: "Jamshedpur", localities: [{ id: "tata-steel", name: "Tata Steel Area", type: "hub" }, { id: "bistupur", name: "Bistupur", type: "hub" }] },
      { id: "dhanbad", name: "Dhanbad", localities: [{ id: "coal-fields", name: "Coal Fields", type: "hub" }] },
      { id: "bokaro", name: "Bokaro", localities: [{ id: "bokaro-steel", name: "Steel City", type: "hub" }] },
      { id: "hazaribagh", name: "Hazaribagh", localities: [] },
    ],
  },
  {
    id: "ka",
    name: "Karnataka",
    code: "KA",
    cities: [
      { id: "bangalore", name: "Bengaluru", isCapital: true, localities: [
        { id: "whitefield", name: "Whitefield", type: "hub" },
        { id: "electronic-city", name: "Electronic City", type: "hub" },
        { id: "mg-road", name: "MG Road", type: "district" },
        { id: "koramangala", name: "Koramangala", type: "district" },
        { id: "indiranagar", name: "Indiranagar", type: "district" },
        { id: "hsr-layout", name: "HSR Layout", type: "district" },
        { id: "jayanagar", name: "Jayanagar", type: "district" },
        { id: "malleswaram", name: "Malleswaram", type: "district" },
        { id: "ub-city", name: "UB City", type: "hub" },
        { id: "manyata", name: "Manyata Tech Park", type: "hub" },
      ]},
      { id: "mysuru", name: "Mysuru", localities: [{ id: "mysuru-palace", name: "Palace Area", type: "hub" }] },
      { id: "hubli", name: "Hubli", localities: [] },
      { id: "mangalore", name: "Mangalore", localities: [] },
      { id: "belgaum", name: "Belgaum", localities: [] },
      { id: "gulbarga", name: "Gulbarga", localities: [] },
      { id: "dharwad", name: "Dharwad", localities: [] },
    ],
  },
  {
    id: "kl",
    name: "Kerala",
    code: "KL",
    cities: [
      { id: "thiruvananthapuram", name: "Thiruvananthapuram", isCapital: true, localities: [{ id: "technopark", name: "Technopark", type: "hub" }] },
      { id: "kochi", name: "Kochi", localities: [{ id: "infopark", name: "Infopark", type: "hub" }, { id: "marine-drive", name: "Marine Drive", type: "hub" }] },
      { id: "kozhikode", name: "Kozhikode", localities: [] },
      { id: "thrissur", name: "Thrissur", localities: [] },
      { id: "kollam", name: "Kollam", localities: [] },
      { id: "alappuzha", name: "Alappuzha", localities: [] },
      { id: "kannur", name: "Kannur", localities: [] },
    ],
  },
  {
    id: "mp",
    name: "Madhya Pradesh",
    code: "MP",
    cities: [
      { id: "bhopal", name: "Bhopal", isCapital: true, localities: [{ id: "mp-nagar", name: "MP Nagar", type: "hub" }, { id: "arera-colony", name: "Arera Colony", type: "district" }] },
      { id: "indore", name: "Indore", localities: [{ id: "vijay-nagar", name: "Vijay Nagar", type: "hub" }, { id: "palasia", name: "Palasia", type: "hub" }] },
      { id: "gwalior", name: "Gwalior", localities: [] },
      { id: "jabalpur", name: "Jabalpur", localities: [] },
      { id: "ujjain", name: "Ujjain", localities: [{ id: "mahakal", name: "Mahakal Temple Area", type: "hub" }] },
      { id: "sagar", name: "Sagar", localities: [] },
      { id: "dewas", name: "Dewas", localities: [] },
    ],
  },
  {
    id: "mh",
    name: "Maharashtra",
    code: "MH",
    cities: [
      { id: "mumbai", name: "Mumbai", isCapital: false, localities: [
        { id: "bkc", name: "Bandra Kurla Complex", type: "hub" },
        { id: "nariman", name: "Nariman Point", type: "hub" },
        { id: "andheri", name: "Andheri", type: "district" },
        { id: "powai", name: "Powai", type: "district" },
        { id: "lower-parel", name: "Lower Parel", type: "hub" },
        { id: "worli", name: "Worli", type: "hub" },
        { id: "fort", name: "Fort", type: "hub" },
        { id: "malad", name: "Malad", type: "district" },
        { id: "goregaon", name: "Goregaon", type: "district" },
        { id: "thane", name: "Thane", type: "district" },
        { id: "navi-mumbai", name: "Navi Mumbai", type: "hub" },
      ]},
      { id: "pune", name: "Pune", localities: [
        { id: "hinjewadi", name: "Hinjewadi IT Park", type: "hub" },
        { id: "koregaon", name: "Koregaon Park", type: "district" },
        { id: "shivaji-nagar", name: "Shivaji Nagar", type: "district" },
        { id: "kharadi", name: "Kharadi", type: "hub" },
        { id: "magarpatta", name: "Magarpatta", type: "hub" },
        { id: "baner", name: "Baner", type: "district" },
      ]},
      { id: "nagpur", name: "Nagpur", localities: [{ id: "mihan", name: "MIHAN", type: "hub" }] },
      { id: "nashik", name: "Nashik", localities: [] },
      { id: "aurangabad", name: "Aurangabad", localities: [{ id: "waluj", name: "Waluj MIDC", type: "hub" }] },
      { id: "solapur", name: "Solapur", localities: [] },
      { id: "kolhapur", name: "Kolhapur", localities: [] },
      { id: "sangli", name: "Sangli", localities: [] },
    ],
  },
  {
    id: "mn",
    name: "Manipur",
    code: "MN",
    cities: [
      { id: "imphal", name: "Imphal", isCapital: true, localities: [{ id: "imphal-center", name: "City Center", type: "capital" }] },
      { id: "thoubal", name: "Thoubal", localities: [] },
    ],
  },
  {
    id: "ml",
    name: "Meghalaya",
    code: "ML",
    cities: [
      { id: "shillong", name: "Shillong", isCapital: true, localities: [{ id: "police-bazar", name: "Police Bazar", type: "hub" }] },
      { id: "tura", name: "Tura", localities: [] },
    ],
  },
  {
    id: "mz",
    name: "Mizoram",
    code: "MZ",
    cities: [
      { id: "aizawl", name: "Aizawl", isCapital: true, localities: [{ id: "aizawl-center", name: "City Center", type: "capital" }] },
      { id: "lunglei", name: "Lunglei", localities: [] },
    ],
  },
  {
    id: "nl",
    name: "Nagaland",
    code: "NL",
    cities: [
      { id: "kohima", name: "Kohima", isCapital: true, localities: [{ id: "kohima-center", name: "City Center", type: "capital" }] },
      { id: "dimapur", name: "Dimapur", localities: [] },
    ],
  },
  {
    id: "or",
    name: "Odisha",
    code: "OR",
    cities: [
      { id: "bhubaneswar", name: "Bhubaneswar", isCapital: true, localities: [{ id: "infocity", name: "Infocity", type: "hub" }, { id: "patia", name: "Patia", type: "hub" }] },
      { id: "cuttack", name: "Cuttack", localities: [] },
      { id: "rourkela", name: "Rourkela", localities: [{ id: "rsp", name: "Rourkela Steel Plant", type: "hub" }] },
      { id: "puri", name: "Puri", localities: [{ id: "jagannath", name: "Jagannath Temple Area", type: "hub" }] },
      { id: "berhampur", name: "Berhampur", localities: [] },
      { id: "sambalpur", name: "Sambalpur", localities: [] },
    ],
  },
  {
    id: "pb",
    name: "Punjab",
    code: "PB",
    cities: [
      { id: "chandigarh-pb", name: "Chandigarh", isCapital: true, localities: [{ id: "sector-17", name: "Sector 17", type: "hub" }] },
      { id: "ludhiana", name: "Ludhiana", localities: [{ id: "ludhiana-industrial", name: "Industrial Area", type: "hub" }] },
      { id: "amritsar", name: "Amritsar", localities: [{ id: "golden-temple", name: "Golden Temple Area", type: "hub" }] },
      { id: "jalandhar", name: "Jalandhar", localities: [] },
      { id: "patiala", name: "Patiala", localities: [] },
      { id: "bathinda", name: "Bathinda", localities: [] },
      { id: "mohali", name: "Mohali", localities: [{ id: "it-city", name: "IT City", type: "hub" }] },
    ],
  },
  {
    id: "rj",
    name: "Rajasthan",
    code: "RJ",
    cities: [
      { id: "jaipur", name: "Jaipur", isCapital: true, localities: [{ id: "mi-road", name: "MI Road", type: "hub" }, { id: "mansarovar", name: "Mansarovar", type: "district" }, { id: "sitapura", name: "Sitapura Industrial", type: "hub" }] },
      { id: "jodhpur", name: "Jodhpur", localities: [] },
      { id: "udaipur", name: "Udaipur", localities: [{ id: "fateh-sagar", name: "Fateh Sagar", type: "hub" }] },
      { id: "kota", name: "Kota", localities: [{ id: "coaching-hub", name: "Coaching Hub", type: "hub" }] },
      { id: "bikaner", name: "Bikaner", localities: [] },
      { id: "ajmer", name: "Ajmer", localities: [{ id: "dargah", name: "Dargah Area", type: "hub" }] },
      { id: "alwar", name: "Alwar", localities: [] },
    ],
  },
  {
    id: "sk",
    name: "Sikkim",
    code: "SK",
    cities: [
      { id: "gangtok", name: "Gangtok", isCapital: true, localities: [{ id: "mg-marg", name: "MG Marg", type: "hub" }] },
      { id: "namchi", name: "Namchi", localities: [] },
    ],
  },
  {
    id: "tn",
    name: "Tamil Nadu",
    code: "TN",
    cities: [
      { id: "chennai", name: "Chennai", isCapital: true, localities: [
        { id: "tidel", name: "Tidel Park", type: "hub" },
        { id: "anna-nagar", name: "Anna Nagar", type: "district" },
        { id: "t-nagar", name: "T Nagar", type: "district" },
        { id: "omr", name: "OMR IT Corridor", type: "hub" },
        { id: "sholinganallur", name: "Sholinganallur", type: "hub" },
        { id: "guindy", name: "Guindy", type: "hub" },
        { id: "egmore", name: "Egmore", type: "district" },
        { id: "adyar", name: "Adyar", type: "district" },
      ]},
      { id: "coimbatore", name: "Coimbatore", localities: [{ id: "tidel-cbe", name: "TIDEL Park", type: "hub" }] },
      { id: "madurai", name: "Madurai", localities: [{ id: "meenakshi", name: "Meenakshi Temple Area", type: "hub" }] },
      { id: "trichy", name: "Tiruchirappalli", localities: [] },
      { id: "salem", name: "Salem", localities: [] },
      { id: "tirunelveli", name: "Tirunelveli", localities: [] },
      { id: "vellore", name: "Vellore", localities: [] },
      { id: "erode", name: "Erode", localities: [] },
    ],
  },
  {
    id: "ts",
    name: "Telangana",
    code: "TS",
    cities: [
      { id: "hyderabad", name: "Hyderabad", isCapital: true, localities: [
        { id: "hitec-city", name: "HITEC City", type: "hub" },
        { id: "gachibowli", name: "Gachibowli", type: "hub" },
        { id: "banjara-hills", name: "Banjara Hills", type: "district" },
        { id: "jubilee-hills", name: "Jubilee Hills", type: "district" },
        { id: "madhapur", name: "Madhapur", type: "hub" },
        { id: "kondapur", name: "Kondapur", type: "district" },
        { id: "secunderabad", name: "Secunderabad", type: "district" },
        { id: "kukatpally", name: "Kukatpally", type: "district" },
      ]},
      { id: "warangal", name: "Warangal", localities: [] },
      { id: "nizamabad", name: "Nizamabad", localities: [] },
      { id: "karimnagar", name: "Karimnagar", localities: [] },
      { id: "khammam", name: "Khammam", localities: [] },
    ],
  },
  {
    id: "tr",
    name: "Tripura",
    code: "TR",
    cities: [
      { id: "agartala", name: "Agartala", isCapital: true, localities: [{ id: "agartala-center", name: "City Center", type: "capital" }] },
      { id: "udaipur-tr", name: "Udaipur", localities: [] },
    ],
  },
  {
    id: "up",
    name: "Uttar Pradesh",
    code: "UP",
    cities: [
      { id: "lucknow", name: "Lucknow", isCapital: true, localities: [{ id: "hazratganj", name: "Hazratganj", type: "hub" }, { id: "gomti-nagar", name: "Gomti Nagar", type: "hub" }] },
      { id: "noida", name: "Noida", localities: [
        { id: "sector62", name: "Sector 62", type: "hub" },
        { id: "sector125", name: "Sector 125", type: "hub" },
        { id: "sector18", name: "Sector 18", type: "hub" },
        { id: "greater-noida", name: "Greater Noida", type: "hub" },
      ]},
      { id: "kanpur", name: "Kanpur", localities: [] },
      { id: "agra", name: "Agra", localities: [{ id: "taj-area", name: "Taj Mahal Area", type: "hub" }] },
      { id: "varanasi", name: "Varanasi", localities: [{ id: "ghats", name: "Ghats Area", type: "hub" }] },
      { id: "prayagraj", name: "Prayagraj", localities: [{ id: "sangam", name: "Sangam Area", type: "hub" }] },
      { id: "meerut", name: "Meerut", localities: [] },
      { id: "ghaziabad", name: "Ghaziabad", localities: [{ id: "indirapuram", name: "Indirapuram", type: "hub" }] },
      { id: "bareilly", name: "Bareilly", localities: [] },
      { id: "aligarh", name: "Aligarh", localities: [] },
      { id: "moradabad", name: "Moradabad", localities: [] },
      { id: "gorakhpur", name: "Gorakhpur", localities: [] },
      { id: "ayodhya", name: "Ayodhya", localities: [{ id: "ram-mandir", name: "Ram Mandir Area", type: "hub" }] },
    ],
  },
  {
    id: "uk",
    name: "Uttarakhand",
    code: "UK",
    cities: [
      { id: "dehradun", name: "Dehradun", isCapital: true, localities: [{ id: "rajpur-road", name: "Rajpur Road", type: "hub" }] },
      { id: "haridwar", name: "Haridwar", localities: [{ id: "har-ki-pauri", name: "Har Ki Pauri", type: "hub" }] },
      { id: "rishikesh", name: "Rishikesh", localities: [{ id: "laxman-jhula", name: "Laxman Jhula", type: "hub" }] },
      { id: "nainital", name: "Nainital", localities: [] },
      { id: "haldwani", name: "Haldwani", localities: [] },
      { id: "roorkee", name: "Roorkee", localities: [{ id: "iit-roorkee", name: "IIT Roorkee", type: "hub" }] },
    ],
  },
  {
    id: "wb",
    name: "West Bengal",
    code: "WB",
    cities: [
      { id: "kolkata", name: "Kolkata", isCapital: true, localities: [
        { id: "salt-lake", name: "Salt Lake", type: "hub" },
        { id: "park-street", name: "Park Street", type: "hub" },
        { id: "rajarhat", name: "Rajarhat", type: "hub" },
        { id: "dalhousie", name: "Dalhousie Square", type: "hub" },
        { id: "howrah", name: "Howrah", type: "district" },
      ]},
      { id: "siliguri", name: "Siliguri", localities: [] },
      { id: "durgapur", name: "Durgapur", localities: [{ id: "durgapur-steel", name: "Steel Plant Area", type: "hub" }] },
      { id: "asansol", name: "Asansol", localities: [] },
      { id: "kharagpur", name: "Kharagpur", localities: [{ id: "iit-kgp", name: "IIT Kharagpur", type: "hub" }] },
      { id: "darjeeling", name: "Darjeeling", localities: [{ id: "mall-dj", name: "Mall Area", type: "hub" }] },
    ],
  },
  // Union Territories
  {
    id: "dl",
    name: "Delhi NCR",
    code: "DL",
    cities: [
      { id: "newdelhi", name: "New Delhi", isCapital: true, localities: [
        { id: "cp", name: "Connaught Place", type: "hub" },
        { id: "southdelhi", name: "South Delhi", type: "district" },
        { id: "parliament", name: "Parliament Street", type: "capital" },
        { id: "nehru-place", name: "Nehru Place", type: "hub" },
        { id: "saket", name: "Saket", type: "district" },
        { id: "dwarka", name: "Dwarka", type: "district" },
        { id: "karol-bagh", name: "Karol Bagh", type: "district" },
        { id: "chandni-chowk", name: "Chandni Chowk", type: "district" },
        { id: "aerocity", name: "Aerocity", type: "hub" },
      ]},
    ],
  },
  {
    id: "ch",
    name: "Chandigarh",
    code: "CH",
    cities: [
      { id: "chandigarh", name: "Chandigarh", isCapital: true, localities: [{ id: "sector-17-chd", name: "Sector 17", type: "hub" }, { id: "sector-35", name: "Sector 35", type: "district" }] },
    ],
  },
  {
    id: "an",
    name: "Andaman and Nicobar",
    code: "AN",
    cities: [
      { id: "port-blair", name: "Port Blair", isCapital: true, localities: [] },
    ],
  },
  {
    id: "ld",
    name: "Lakshadweep",
    code: "LD",
    cities: [
      { id: "kavaratti", name: "Kavaratti", isCapital: true, localities: [] },
    ],
  },
  {
    id: "py",
    name: "Puducherry",
    code: "PY",
    cities: [
      { id: "puducherry", name: "Puducherry", isCapital: true, localities: [{ id: "white-town", name: "White Town", type: "hub" }] },
    ],
  },
  {
    id: "jk",
    name: "Jammu and Kashmir",
    code: "JK",
    cities: [
      { id: "srinagar", name: "Srinagar", isCapital: true, localities: [{ id: "dal-lake", name: "Dal Lake", type: "hub" }, { id: "lal-chowk", name: "Lal Chowk", type: "hub" }] },
      { id: "jammu", name: "Jammu", localities: [{ id: "jammu-tawi", name: "Jammu Tawi", type: "hub" }] },
    ],
  },
  {
    id: "la",
    name: "Ladakh",
    code: "LA",
    cities: [
      { id: "leh", name: "Leh", isCapital: true, localities: [{ id: "leh-market", name: "Main Market", type: "hub" }] },
      { id: "kargil", name: "Kargil", localities: [] },
    ],
  },
  {
    id: "dn",
    name: "Dadra Nagar Haveli and Daman Diu",
    code: "DN",
    cities: [
      { id: "daman", name: "Daman", isCapital: true, localities: [] },
      { id: "silvassa", name: "Silvassa", localities: [] },
    ],
  },
];

// 7 Continents with ALL countries
export const GEO_HIERARCHY: Continent[] = [
  {
    id: "asia",
    name: "Asia",
    countries: [
      { id: "in", name: "India", code: "IN", flag: "🇮🇳", states: INDIA_STATES },
      { id: "cn", name: "China", code: "CN", flag: "🇨🇳", states: [
        { id: "beijing-m", name: "Beijing", cities: [{ id: "beijing", name: "Beijing", isCapital: true, localities: [{ id: "zhongguancun", name: "Zhongguancun", type: "hub" }, { id: "cbd", name: "CBD", type: "hub" }] }] },
        { id: "shanghai-m", name: "Shanghai", cities: [{ id: "shanghai", name: "Shanghai", localities: [{ id: "pudong", name: "Pudong", type: "hub" }, { id: "lujiazui", name: "Lujiazui", type: "hub" }] }] },
        { id: "guangdong", name: "Guangdong", cities: [{ id: "shenzhen", name: "Shenzhen", localities: [{ id: "nanshan", name: "Nanshan", type: "hub" }] }, { id: "guangzhou", name: "Guangzhou", localities: [] }] },
        { id: "zhejiang", name: "Zhejiang", cities: [{ id: "hangzhou", name: "Hangzhou", localities: [] }] },
        { id: "jiangsu", name: "Jiangsu", cities: [{ id: "nanjing", name: "Nanjing", localities: [] }, { id: "suzhou", name: "Suzhou", localities: [] }] },
        { id: "sichuan", name: "Sichuan", cities: [{ id: "chengdu", name: "Chengdu", localities: [] }] },
      ]},
      { id: "jp", name: "Japan", code: "JP", flag: "🇯🇵", states: [
        { id: "tokyo-p", name: "Tokyo", cities: [{ id: "tokyo", name: "Tokyo", isCapital: true, localities: [{ id: "shibuya", name: "Shibuya", type: "district" }, { id: "shinjuku", name: "Shinjuku", type: "district" }, { id: "marunouchi", name: "Marunouchi", type: "hub" }] }] },
        { id: "osaka-p", name: "Osaka", cities: [{ id: "osaka", name: "Osaka", localities: [{ id: "umeda", name: "Umeda", type: "hub" }] }] },
        { id: "aichi", name: "Aichi", cities: [{ id: "nagoya", name: "Nagoya", localities: [] }] },
        { id: "kyoto-p", name: "Kyoto", cities: [{ id: "kyoto", name: "Kyoto", localities: [] }] },
      ]},
      { id: "kr", name: "South Korea", code: "KR", flag: "🇰🇷", states: [
        { id: "seoul-m", name: "Seoul Metropolitan", cities: [{ id: "seoul", name: "Seoul", isCapital: true, localities: [{ id: "gangnam", name: "Gangnam", type: "district" }, { id: "yeouido", name: "Yeouido", type: "hub" }] }] },
        { id: "busan-m", name: "Busan", cities: [{ id: "busan", name: "Busan", localities: [] }] },
      ]},
      { id: "id", name: "Indonesia", code: "ID", flag: "🇮🇩", states: [
        { id: "jakarta-p", name: "Jakarta", cities: [{ id: "jakarta", name: "Jakarta", isCapital: true, localities: [{ id: "sudirman", name: "Sudirman", type: "hub" }] }] },
        { id: "bali-p", name: "Bali", cities: [{ id: "denpasar", name: "Denpasar", localities: [] }] },
      ]},
      { id: "th", name: "Thailand", code: "TH", flag: "🇹🇭", states: [
        { id: "bangkok-p", name: "Bangkok", cities: [{ id: "bangkok", name: "Bangkok", isCapital: true, localities: [{ id: "silom", name: "Silom", type: "hub" }] }] },
      ]},
      { id: "vn", name: "Vietnam", code: "VN", flag: "🇻🇳", states: [
        { id: "hanoi-p", name: "Hanoi", cities: [{ id: "hanoi", name: "Hanoi", isCapital: true, localities: [] }] },
        { id: "hcm-p", name: "Ho Chi Minh", cities: [{ id: "hcm", name: "Ho Chi Minh City", localities: [] }] },
      ]},
      { id: "ph", name: "Philippines", code: "PH", flag: "🇵🇭", states: [
        { id: "ncr", name: "Metro Manila", cities: [{ id: "manila", name: "Manila", isCapital: true, localities: [{ id: "makati", name: "Makati", type: "hub" }] }] },
      ]},
      { id: "my", name: "Malaysia", code: "MY", flag: "🇲🇾", states: [
        { id: "kl-p", name: "Kuala Lumpur", cities: [{ id: "kl", name: "Kuala Lumpur", isCapital: true, localities: [{ id: "klcc", name: "KLCC", type: "hub" }] }] },
      ]},
      { id: "sg", name: "Singapore", code: "SG", flag: "🇸🇬", states: [
        { id: "singapore-c", name: "Singapore", cities: [{ id: "singapore", name: "Singapore", isCapital: true, localities: [{ id: "cbd-sg", name: "CBD", type: "hub" }, { id: "marina-bay", name: "Marina Bay", type: "hub" }] }] },
      ]},
      { id: "pk", name: "Pakistan", code: "PK", flag: "🇵🇰", states: [
        { id: "punjab-pk", name: "Punjab", cities: [{ id: "lahore", name: "Lahore", localities: [] }] },
        { id: "sindh", name: "Sindh", cities: [{ id: "karachi", name: "Karachi", localities: [] }] },
        { id: "islamabad-ct", name: "Islamabad Capital", cities: [{ id: "islamabad", name: "Islamabad", isCapital: true, localities: [] }] },
      ]},
      { id: "bd", name: "Bangladesh", code: "BD", flag: "🇧🇩", states: [
        { id: "dhaka-d", name: "Dhaka Division", cities: [{ id: "dhaka", name: "Dhaka", isCapital: true, localities: [] }] },
      ]},
      { id: "lk", name: "Sri Lanka", code: "LK", flag: "🇱🇰", states: [
        { id: "western-lk", name: "Western Province", cities: [{ id: "colombo", name: "Colombo", isCapital: true, localities: [] }] },
      ]},
      { id: "np", name: "Nepal", code: "NP", flag: "🇳🇵", states: [
        { id: "bagmati", name: "Bagmati", cities: [{ id: "kathmandu", name: "Kathmandu", isCapital: true, localities: [] }] },
      ]},
      { id: "ae", name: "UAE", code: "AE", flag: "🇦🇪", states: [
        { id: "dubai-e", name: "Dubai", cities: [{ id: "dubai", name: "Dubai", localities: [{ id: "difc", name: "DIFC", type: "hub" }, { id: "downtown", name: "Downtown", type: "hub" }] }] },
        { id: "abudhabi-e", name: "Abu Dhabi", cities: [{ id: "abudhabi", name: "Abu Dhabi", isCapital: true, localities: [{ id: "adgm", name: "ADGM", type: "hub" }] }] },
      ]},
      { id: "sa", name: "Saudi Arabia", code: "SA", flag: "🇸🇦", states: [
        { id: "riyadh-r", name: "Riyadh", cities: [{ id: "riyadh", name: "Riyadh", isCapital: true, localities: [{ id: "kafd", name: "KAFD", type: "hub" }] }] },
        { id: "makkah-r", name: "Makkah", cities: [{ id: "jeddah", name: "Jeddah", localities: [] }] },
      ]},
      { id: "qa", name: "Qatar", code: "QA", flag: "🇶🇦", states: [
        { id: "doha-m", name: "Doha", cities: [{ id: "doha", name: "Doha", isCapital: true, localities: [{ id: "westbay", name: "West Bay", type: "hub" }] }] },
      ]},
      { id: "kw", name: "Kuwait", code: "KW", flag: "🇰🇼", states: [
        { id: "kuwait-c", name: "Kuwait City", cities: [{ id: "kuwait-city", name: "Kuwait City", isCapital: true, localities: [] }] },
      ]},
      { id: "bh", name: "Bahrain", code: "BH", flag: "🇧🇭", states: [
        { id: "manama-g", name: "Capital", cities: [{ id: "manama", name: "Manama", isCapital: true, localities: [] }] },
      ]},
      { id: "om", name: "Oman", code: "OM", flag: "🇴🇲", states: [
        { id: "muscat-g", name: "Muscat", cities: [{ id: "muscat", name: "Muscat", isCapital: true, localities: [] }] },
      ]},
      { id: "il", name: "Israel", code: "IL", flag: "🇮🇱", states: [
        { id: "tel-aviv-d", name: "Tel Aviv", cities: [{ id: "tel-aviv", name: "Tel Aviv", localities: [] }] },
        { id: "jerusalem-d", name: "Jerusalem", cities: [{ id: "jerusalem", name: "Jerusalem", isCapital: true, localities: [] }] },
      ]},
      { id: "tr", name: "Turkey", code: "TR", flag: "🇹🇷", states: [
        { id: "istanbul-p", name: "Istanbul", cities: [{ id: "istanbul", name: "Istanbul", localities: [] }] },
        { id: "ankara-p", name: "Ankara", cities: [{ id: "ankara", name: "Ankara", isCapital: true, localities: [] }] },
      ]},
      { id: "ir", name: "Iran", code: "IR", flag: "🇮🇷", states: [
        { id: "tehran-p", name: "Tehran", cities: [{ id: "tehran", name: "Tehran", isCapital: true, localities: [] }] },
      ]},
      { id: "iq", name: "Iraq", code: "IQ", flag: "🇮🇶", states: [
        { id: "baghdad-g", name: "Baghdad", cities: [{ id: "baghdad", name: "Baghdad", isCapital: true, localities: [] }] },
      ]},
      { id: "jo", name: "Jordan", code: "JO", flag: "🇯🇴", states: [
        { id: "amman-g", name: "Amman", cities: [{ id: "amman", name: "Amman", isCapital: true, localities: [] }] },
      ]},
      { id: "lb", name: "Lebanon", code: "LB", flag: "🇱🇧", states: [
        { id: "beirut-g", name: "Beirut", cities: [{ id: "beirut", name: "Beirut", isCapital: true, localities: [] }] },
      ]},
      { id: "kz", name: "Kazakhstan", code: "KZ", flag: "🇰🇿", states: [
        { id: "astana-c", name: "Astana", cities: [{ id: "astana", name: "Astana", isCapital: true, localities: [] }] },
        { id: "almaty-c", name: "Almaty", cities: [{ id: "almaty", name: "Almaty", localities: [] }] },
      ]},
      { id: "uz", name: "Uzbekistan", code: "UZ", flag: "🇺🇿", states: [
        { id: "tashkent-p", name: "Tashkent", cities: [{ id: "tashkent", name: "Tashkent", isCapital: true, localities: [] }] },
      ]},
      { id: "af", name: "Afghanistan", code: "AF", flag: "🇦🇫", states: [
        { id: "kabul-p", name: "Kabul", cities: [{ id: "kabul", name: "Kabul", isCapital: true, localities: [] }] },
      ]},
      { id: "mm", name: "Myanmar", code: "MM", flag: "🇲🇲", states: [
        { id: "yangon-r", name: "Yangon", cities: [{ id: "yangon", name: "Yangon", localities: [] }] },
      ]},
      { id: "kh", name: "Cambodia", code: "KH", flag: "🇰🇭", states: [
        { id: "phnom-penh-p", name: "Phnom Penh", cities: [{ id: "phnom-penh", name: "Phnom Penh", isCapital: true, localities: [] }] },
      ]},
      { id: "la", name: "Laos", code: "LA", flag: "🇱🇦", states: [
        { id: "vientiane-p", name: "Vientiane", cities: [{ id: "vientiane", name: "Vientiane", isCapital: true, localities: [] }] },
      ]},
      { id: "mn", name: "Mongolia", code: "MN", flag: "🇲🇳", states: [
        { id: "ulaanbaatar-c", name: "Ulaanbaatar", cities: [{ id: "ulaanbaatar", name: "Ulaanbaatar", isCapital: true, localities: [] }] },
      ]},
      { id: "kp", name: "North Korea", code: "KP", flag: "🇰🇵", states: [
        { id: "pyongyang-p", name: "Pyongyang", cities: [{ id: "pyongyang", name: "Pyongyang", isCapital: true, localities: [] }] },
      ]},
      { id: "tw", name: "Taiwan", code: "TW", flag: "🇹🇼", states: [
        { id: "taipei-c", name: "Taipei", cities: [{ id: "taipei", name: "Taipei", isCapital: true, localities: [] }] },
      ]},
      { id: "hk", name: "Hong Kong", code: "HK", flag: "🇭🇰", states: [
        { id: "hk-c", name: "Hong Kong", cities: [{ id: "hong-kong", name: "Hong Kong", isCapital: true, localities: [{ id: "central", name: "Central", type: "hub" }] }] },
      ]},
      { id: "mo", name: "Macau", code: "MO", flag: "🇲🇴", states: [
        { id: "macau-c", name: "Macau", cities: [{ id: "macau", name: "Macau", isCapital: true, localities: [] }] },
      ]},
      { id: "bt", name: "Bhutan", code: "BT", flag: "🇧🇹", states: [
        { id: "thimphu-d", name: "Thimphu", cities: [{ id: "thimphu", name: "Thimphu", isCapital: true, localities: [] }] },
      ]},
      { id: "mv", name: "Maldives", code: "MV", flag: "🇲🇻", states: [
        { id: "male-c", name: "Male", cities: [{ id: "male", name: "Male", isCapital: true, localities: [] }] },
      ]},
      { id: "bn", name: "Brunei", code: "BN", flag: "🇧🇳", states: [
        { id: "brunei-m", name: "Brunei-Muara", cities: [{ id: "bandar-seri-begawan", name: "Bandar Seri Begawan", isCapital: true, localities: [] }] },
      ]},
      { id: "tl", name: "Timor-Leste", code: "TL", flag: "🇹🇱", states: [
        { id: "dili-d", name: "Dili", cities: [{ id: "dili", name: "Dili", isCapital: true, localities: [] }] },
      ]},
      { id: "ge", name: "Georgia", code: "GE", flag: "🇬🇪", states: [
        { id: "tbilisi-c", name: "Tbilisi", cities: [{ id: "tbilisi", name: "Tbilisi", isCapital: true, localities: [] }] },
      ]},
      { id: "am", name: "Armenia", code: "AM", flag: "🇦🇲", states: [
        { id: "yerevan-c", name: "Yerevan", cities: [{ id: "yerevan", name: "Yerevan", isCapital: true, localities: [] }] },
      ]},
      { id: "az", name: "Azerbaijan", code: "AZ", flag: "🇦🇿", states: [
        { id: "baku-c", name: "Baku", cities: [{ id: "baku", name: "Baku", isCapital: true, localities: [] }] },
      ]},
      { id: "cy", name: "Cyprus", code: "CY", flag: "🇨🇾", states: [
        { id: "nicosia-d", name: "Nicosia", cities: [{ id: "nicosia", name: "Nicosia", isCapital: true, localities: [] }] },
      ]},
      { id: "sy", name: "Syria", code: "SY", flag: "🇸🇾", states: [
        { id: "damascus-g", name: "Damascus", cities: [{ id: "damascus", name: "Damascus", isCapital: true, localities: [] }] },
      ]},
      { id: "ye", name: "Yemen", code: "YE", flag: "🇾🇪", states: [
        { id: "sanaa-g", name: "Sana'a", cities: [{ id: "sanaa", name: "Sana'a", isCapital: true, localities: [] }] },
      ]},
    ],
  },
  {
    id: "africa",
    name: "Africa",
    countries: [
      { id: "za", name: "South Africa", code: "ZA", flag: "🇿🇦", states: [
        { id: "gauteng", name: "Gauteng", cities: [{ id: "johannesburg", name: "Johannesburg", localities: [{ id: "sandton", name: "Sandton", type: "hub" }] }, { id: "pretoria", name: "Pretoria", isCapital: true, localities: [] }] },
        { id: "western-cape", name: "Western Cape", cities: [{ id: "cape-town", name: "Cape Town", localities: [] }] },
        { id: "kwazulu-natal", name: "KwaZulu-Natal", cities: [{ id: "durban", name: "Durban", localities: [] }] },
      ]},
      { id: "ng", name: "Nigeria", code: "NG", flag: "🇳🇬", states: [
        { id: "lagos-s", name: "Lagos", cities: [{ id: "lagos", name: "Lagos", localities: [{ id: "victoria-island", name: "Victoria Island", type: "hub" }] }] },
        { id: "fct", name: "FCT", cities: [{ id: "abuja", name: "Abuja", isCapital: true, localities: [] }] },
      ]},
      { id: "eg", name: "Egypt", code: "EG", flag: "🇪🇬", states: [
        { id: "cairo-g", name: "Cairo", cities: [{ id: "cairo", name: "Cairo", isCapital: true, localities: [] }] },
        { id: "alexandria-g", name: "Alexandria", cities: [{ id: "alexandria", name: "Alexandria", localities: [] }] },
      ]},
      { id: "ke", name: "Kenya", code: "KE", flag: "🇰🇪", states: [
        { id: "nairobi-c", name: "Nairobi", cities: [{ id: "nairobi", name: "Nairobi", isCapital: true, localities: [] }] },
        { id: "mombasa-c", name: "Mombasa", cities: [{ id: "mombasa", name: "Mombasa", localities: [] }] },
      ]},
      { id: "et", name: "Ethiopia", code: "ET", flag: "🇪🇹", states: [
        { id: "addis-ababa-c", name: "Addis Ababa", cities: [{ id: "addis-ababa", name: "Addis Ababa", isCapital: true, localities: [] }] },
      ]},
      { id: "gh", name: "Ghana", code: "GH", flag: "🇬🇭", states: [
        { id: "greater-accra", name: "Greater Accra", cities: [{ id: "accra", name: "Accra", isCapital: true, localities: [] }] },
      ]},
      { id: "tz", name: "Tanzania", code: "TZ", flag: "🇹🇿", states: [
        { id: "dar-es-salaam-r", name: "Dar es Salaam", cities: [{ id: "dar-es-salaam", name: "Dar es Salaam", localities: [] }] },
      ]},
      { id: "ma", name: "Morocco", code: "MA", flag: "🇲🇦", states: [
        { id: "casablanca-r", name: "Casablanca", cities: [{ id: "casablanca", name: "Casablanca", localities: [] }] },
        { id: "rabat-r", name: "Rabat", cities: [{ id: "rabat", name: "Rabat", isCapital: true, localities: [] }] },
      ]},
      { id: "dz", name: "Algeria", code: "DZ", flag: "🇩🇿", states: [
        { id: "algiers-p", name: "Algiers", cities: [{ id: "algiers", name: "Algiers", isCapital: true, localities: [] }] },
      ]},
      { id: "tn", name: "Tunisia", code: "TN", flag: "🇹🇳", states: [
        { id: "tunis-g", name: "Tunis", cities: [{ id: "tunis", name: "Tunis", isCapital: true, localities: [] }] },
      ]},
      { id: "ug", name: "Uganda", code: "UG", flag: "🇺🇬", states: [
        { id: "central-ug", name: "Central Region", cities: [{ id: "kampala", name: "Kampala", isCapital: true, localities: [] }] },
      ]},
      { id: "rw", name: "Rwanda", code: "RW", flag: "🇷🇼", states: [
        { id: "kigali-c", name: "Kigali", cities: [{ id: "kigali", name: "Kigali", isCapital: true, localities: [] }] },
      ]},
      { id: "sn", name: "Senegal", code: "SN", flag: "🇸🇳", states: [
        { id: "dakar-r", name: "Dakar", cities: [{ id: "dakar", name: "Dakar", isCapital: true, localities: [] }] },
      ]},
      { id: "ci", name: "Ivory Coast", code: "CI", flag: "🇨🇮", states: [
        { id: "abidjan-d", name: "Abidjan", cities: [{ id: "abidjan", name: "Abidjan", localities: [] }] },
      ]},
      { id: "cm", name: "Cameroon", code: "CM", flag: "🇨🇲", states: [
        { id: "centre-cm", name: "Centre", cities: [{ id: "yaounde", name: "Yaoundé", isCapital: true, localities: [] }] },
      ]},
      { id: "ao", name: "Angola", code: "AO", flag: "🇦🇴", states: [
        { id: "luanda-p", name: "Luanda", cities: [{ id: "luanda", name: "Luanda", isCapital: true, localities: [] }] },
      ]},
      { id: "mz", name: "Mozambique", code: "MZ", flag: "🇲🇿", states: [
        { id: "maputo-p", name: "Maputo", cities: [{ id: "maputo", name: "Maputo", isCapital: true, localities: [] }] },
      ]},
      { id: "zw", name: "Zimbabwe", code: "ZW", flag: "🇿🇼", states: [
        { id: "harare-p", name: "Harare", cities: [{ id: "harare", name: "Harare", isCapital: true, localities: [] }] },
      ]},
      { id: "zm", name: "Zambia", code: "ZM", flag: "🇿🇲", states: [
        { id: "lusaka-p", name: "Lusaka", cities: [{ id: "lusaka", name: "Lusaka", isCapital: true, localities: [] }] },
      ]},
      { id: "bw", name: "Botswana", code: "BW", flag: "🇧🇼", states: [
        { id: "south-east-bw", name: "South-East", cities: [{ id: "gaborone", name: "Gaborone", isCapital: true, localities: [] }] },
      ]},
      { id: "na", name: "Namibia", code: "NA", flag: "🇳🇦", states: [
        { id: "khomas", name: "Khomas", cities: [{ id: "windhoek", name: "Windhoek", isCapital: true, localities: [] }] },
      ]},
      { id: "mu", name: "Mauritius", code: "MU", flag: "🇲🇺", states: [
        { id: "port-louis-d", name: "Port Louis", cities: [{ id: "port-louis", name: "Port Louis", isCapital: true, localities: [] }] },
      ]},
      { id: "mg", name: "Madagascar", code: "MG", flag: "🇲🇬", states: [
        { id: "analamanga", name: "Analamanga", cities: [{ id: "antananarivo", name: "Antananarivo", isCapital: true, localities: [] }] },
      ]},
      { id: "cd", name: "DR Congo", code: "CD", flag: "🇨🇩", states: [
        { id: "kinshasa-p", name: "Kinshasa", cities: [{ id: "kinshasa", name: "Kinshasa", isCapital: true, localities: [] }] },
      ]},
      { id: "sd", name: "Sudan", code: "SD", flag: "🇸🇩", states: [
        { id: "khartoum-s", name: "Khartoum", cities: [{ id: "khartoum", name: "Khartoum", isCapital: true, localities: [] }] },
      ]},
      { id: "ly", name: "Libya", code: "LY", flag: "🇱🇾", states: [
        { id: "tripoli-d", name: "Tripoli", cities: [{ id: "tripoli", name: "Tripoli", isCapital: true, localities: [] }] },
      ]},
      { id: "ml", name: "Mali", code: "ML", flag: "🇲🇱", states: [
        { id: "bamako-d", name: "Bamako", cities: [{ id: "bamako", name: "Bamako", isCapital: true, localities: [] }] },
      ]},
      { id: "bf", name: "Burkina Faso", code: "BF", flag: "🇧🇫", states: [
        { id: "centre-bf", name: "Centre", cities: [{ id: "ouagadougou", name: "Ouagadougou", isCapital: true, localities: [] }] },
      ]},
      { id: "ne", name: "Niger", code: "NE", flag: "🇳🇪", states: [
        { id: "niamey-c", name: "Niamey", cities: [{ id: "niamey", name: "Niamey", isCapital: true, localities: [] }] },
      ]},
      { id: "td", name: "Chad", code: "TD", flag: "🇹🇩", states: [
        { id: "ndjamena-r", name: "N'Djamena", cities: [{ id: "ndjamena", name: "N'Djamena", isCapital: true, localities: [] }] },
      ]},
      { id: "gn", name: "Guinea", code: "GN", flag: "🇬🇳", states: [
        { id: "conakry-r", name: "Conakry", cities: [{ id: "conakry", name: "Conakry", isCapital: true, localities: [] }] },
      ]},
      { id: "bj", name: "Benin", code: "BJ", flag: "🇧🇯", states: [
        { id: "littoral-bj", name: "Littoral", cities: [{ id: "cotonou", name: "Cotonou", localities: [] }] },
      ]},
      { id: "tg", name: "Togo", code: "TG", flag: "🇹🇬", states: [
        { id: "maritime-tg", name: "Maritime", cities: [{ id: "lome", name: "Lomé", isCapital: true, localities: [] }] },
      ]},
      { id: "so", name: "Somalia", code: "SO", flag: "🇸🇴", states: [
        { id: "banaadir", name: "Banaadir", cities: [{ id: "mogadishu", name: "Mogadishu", isCapital: true, localities: [] }] },
      ]},
      { id: "er", name: "Eritrea", code: "ER", flag: "🇪🇷", states: [
        { id: "maekel", name: "Maekel", cities: [{ id: "asmara", name: "Asmara", isCapital: true, localities: [] }] },
      ]},
      { id: "dj", name: "Djibouti", code: "DJ", flag: "🇩🇯", states: [
        { id: "djibouti-r", name: "Djibouti", cities: [{ id: "djibouti-city", name: "Djibouti", isCapital: true, localities: [] }] },
      ]},
      { id: "ss", name: "South Sudan", code: "SS", flag: "🇸🇸", states: [
        { id: "central-eq", name: "Central Equatoria", cities: [{ id: "juba", name: "Juba", isCapital: true, localities: [] }] },
      ]},
      { id: "cg", name: "Congo", code: "CG", flag: "🇨🇬", states: [
        { id: "brazzaville-d", name: "Brazzaville", cities: [{ id: "brazzaville", name: "Brazzaville", isCapital: true, localities: [] }] },
      ]},
      { id: "ga", name: "Gabon", code: "GA", flag: "🇬🇦", states: [
        { id: "estuaire", name: "Estuaire", cities: [{ id: "libreville", name: "Libreville", isCapital: true, localities: [] }] },
      ]},
      { id: "gq", name: "Equatorial Guinea", code: "GQ", flag: "🇬🇶", states: [
        { id: "bioko-norte", name: "Bioko Norte", cities: [{ id: "malabo", name: "Malabo", isCapital: true, localities: [] }] },
      ]},
      { id: "cf", name: "Central African Republic", code: "CF", flag: "🇨🇫", states: [
        { id: "bangui-c", name: "Bangui", cities: [{ id: "bangui", name: "Bangui", isCapital: true, localities: [] }] },
      ]},
      { id: "bi", name: "Burundi", code: "BI", flag: "🇧🇮", states: [
        { id: "bujumbura-m", name: "Bujumbura Mairie", cities: [{ id: "bujumbura", name: "Bujumbura", localities: [] }] },
      ]},
      { id: "mw", name: "Malawi", code: "MW", flag: "🇲🇼", states: [
        { id: "central-mw", name: "Central Region", cities: [{ id: "lilongwe", name: "Lilongwe", isCapital: true, localities: [] }] },
      ]},
      { id: "ls", name: "Lesotho", code: "LS", flag: "🇱🇸", states: [
        { id: "maseru-d", name: "Maseru", cities: [{ id: "maseru", name: "Maseru", isCapital: true, localities: [] }] },
      ]},
      { id: "sz", name: "Eswatini", code: "SZ", flag: "🇸🇿", states: [
        { id: "hhohho", name: "Hhohho", cities: [{ id: "mbabane", name: "Mbabane", isCapital: true, localities: [] }] },
      ]},
      { id: "gm", name: "Gambia", code: "GM", flag: "🇬🇲", states: [
        { id: "banjul-c", name: "Banjul", cities: [{ id: "banjul", name: "Banjul", isCapital: true, localities: [] }] },
      ]},
      { id: "gw", name: "Guinea-Bissau", code: "GW", flag: "🇬🇼", states: [
        { id: "bissau-r", name: "Bissau", cities: [{ id: "bissau", name: "Bissau", isCapital: true, localities: [] }] },
      ]},
      { id: "mr", name: "Mauritania", code: "MR", flag: "🇲🇷", states: [
        { id: "nouakchott-o", name: "Nouakchott", cities: [{ id: "nouakchott", name: "Nouakchott", isCapital: true, localities: [] }] },
      ]},
      { id: "lr", name: "Liberia", code: "LR", flag: "🇱🇷", states: [
        { id: "montserrado", name: "Montserrado", cities: [{ id: "monrovia", name: "Monrovia", isCapital: true, localities: [] }] },
      ]},
      { id: "sl", name: "Sierra Leone", code: "SL", flag: "🇸🇱", states: [
        { id: "western-area", name: "Western Area", cities: [{ id: "freetown", name: "Freetown", isCapital: true, localities: [] }] },
      ]},
      { id: "cv", name: "Cape Verde", code: "CV", flag: "🇨🇻", states: [
        { id: "santiago-cv", name: "Santiago", cities: [{ id: "praia", name: "Praia", isCapital: true, localities: [] }] },
      ]},
      { id: "st", name: "São Tomé and Príncipe", code: "ST", flag: "🇸🇹", states: [
        { id: "agua-grande", name: "Água Grande", cities: [{ id: "sao-tome", name: "São Tomé", isCapital: true, localities: [] }] },
      ]},
      { id: "sc", name: "Seychelles", code: "SC", flag: "🇸🇨", states: [
        { id: "mahe", name: "Mahe", cities: [{ id: "victoria-sc", name: "Victoria", isCapital: true, localities: [] }] },
      ]},
      { id: "km", name: "Comoros", code: "KM", flag: "🇰🇲", states: [
        { id: "grande-comore", name: "Grande Comore", cities: [{ id: "moroni", name: "Moroni", isCapital: true, localities: [] }] },
      ]},
    ],
  },
  {
    id: "europe",
    name: "Europe",
    countries: [
      { id: "gb", name: "United Kingdom", code: "GB", flag: "🇬🇧", states: [
        { id: "england", name: "England", cities: [{ id: "london", name: "London", isCapital: true, localities: [{ id: "city-of-london", name: "City of London", type: "hub" }, { id: "canary-wharf", name: "Canary Wharf", type: "hub" }, { id: "westminster", name: "Westminster", type: "capital" }] }, { id: "manchester", name: "Manchester", localities: [] }, { id: "birmingham", name: "Birmingham", localities: [] }, { id: "leeds", name: "Leeds", localities: [] }, { id: "liverpool", name: "Liverpool", localities: [] }] },
        { id: "scotland", name: "Scotland", cities: [{ id: "edinburgh", name: "Edinburgh", isCapital: true, localities: [] }, { id: "glasgow", name: "Glasgow", localities: [] }] },
        { id: "wales", name: "Wales", cities: [{ id: "cardiff", name: "Cardiff", isCapital: true, localities: [] }] },
        { id: "northern-ireland", name: "Northern Ireland", cities: [{ id: "belfast", name: "Belfast", isCapital: true, localities: [] }] },
      ]},
      { id: "de", name: "Germany", code: "DE", flag: "🇩🇪", states: [
        { id: "berlin-s", name: "Berlin", cities: [{ id: "berlin", name: "Berlin", isCapital: true, localities: [{ id: "mitte", name: "Mitte", type: "hub" }] }] },
        { id: "bavaria", name: "Bavaria", cities: [{ id: "munich", name: "Munich", localities: [] }] },
        { id: "hessen", name: "Hessen", cities: [{ id: "frankfurt", name: "Frankfurt", localities: [{ id: "bankenviertel", name: "Bankenviertel", type: "hub" }] }] },
        { id: "nrw", name: "North Rhine-Westphalia", cities: [{ id: "cologne", name: "Cologne", localities: [] }, { id: "dusseldorf", name: "Düsseldorf", localities: [] }] },
        { id: "hamburg-s", name: "Hamburg", cities: [{ id: "hamburg", name: "Hamburg", localities: [] }] },
      ]},
      { id: "fr", name: "France", code: "FR", flag: "🇫🇷", states: [
        { id: "ile-de-france", name: "Île-de-France", cities: [{ id: "paris", name: "Paris", isCapital: true, localities: [{ id: "la-defense", name: "La Défense", type: "hub" }] }] },
        { id: "paca", name: "Provence-Alpes-Côte d'Azur", cities: [{ id: "marseille", name: "Marseille", localities: [] }, { id: "nice", name: "Nice", localities: [] }] },
        { id: "auvergne-rhone-alpes", name: "Auvergne-Rhône-Alpes", cities: [{ id: "lyon", name: "Lyon", localities: [] }] },
      ]},
      { id: "it", name: "Italy", code: "IT", flag: "🇮🇹", states: [
        { id: "lazio", name: "Lazio", cities: [{ id: "rome", name: "Rome", isCapital: true, localities: [] }] },
        { id: "lombardy", name: "Lombardy", cities: [{ id: "milan", name: "Milan", localities: [{ id: "porta-nuova", name: "Porta Nuova", type: "hub" }] }] },
        { id: "veneto", name: "Veneto", cities: [{ id: "venice", name: "Venice", localities: [] }] },
        { id: "tuscany", name: "Tuscany", cities: [{ id: "florence", name: "Florence", localities: [] }] },
      ]},
      { id: "es", name: "Spain", code: "ES", flag: "🇪🇸", states: [
        { id: "madrid-c", name: "Community of Madrid", cities: [{ id: "madrid", name: "Madrid", isCapital: true, localities: [] }] },
        { id: "catalonia", name: "Catalonia", cities: [{ id: "barcelona", name: "Barcelona", localities: [{ id: "22-at", name: "22@", type: "hub" }] }] },
        { id: "andalusia", name: "Andalusia", cities: [{ id: "seville", name: "Seville", localities: [] }] },
        { id: "valencia-c", name: "Valencia", cities: [{ id: "valencia", name: "Valencia", localities: [] }] },
      ]},
      { id: "nl", name: "Netherlands", code: "NL", flag: "🇳🇱", states: [
        { id: "north-holland", name: "North Holland", cities: [{ id: "amsterdam", name: "Amsterdam", isCapital: true, localities: [{ id: "zuidas", name: "Zuidas", type: "hub" }] }] },
        { id: "south-holland", name: "South Holland", cities: [{ id: "rotterdam", name: "Rotterdam", localities: [] }, { id: "the-hague", name: "The Hague", localities: [] }] },
      ]},
      { id: "be", name: "Belgium", code: "BE", flag: "🇧🇪", states: [
        { id: "brussels-c", name: "Brussels-Capital", cities: [{ id: "brussels", name: "Brussels", isCapital: true, localities: [] }] },
        { id: "flanders", name: "Flanders", cities: [{ id: "antwerp", name: "Antwerp", localities: [] }] },
      ]},
      { id: "ch", name: "Switzerland", code: "CH", flag: "🇨🇭", states: [
        { id: "zurich-c", name: "Zurich", cities: [{ id: "zurich", name: "Zurich", localities: [{ id: "bahnhofstrasse", name: "Bahnhofstrasse", type: "hub" }] }] },
        { id: "geneva-c", name: "Geneva", cities: [{ id: "geneva", name: "Geneva", localities: [] }] },
      ]},
      { id: "at", name: "Austria", code: "AT", flag: "🇦🇹", states: [
        { id: "vienna-s", name: "Vienna", cities: [{ id: "vienna", name: "Vienna", isCapital: true, localities: [] }] },
      ]},
      { id: "se", name: "Sweden", code: "SE", flag: "🇸🇪", states: [
        { id: "stockholm-c", name: "Stockholm", cities: [{ id: "stockholm", name: "Stockholm", isCapital: true, localities: [] }] },
      ]},
      { id: "no", name: "Norway", code: "NO", flag: "🇳🇴", states: [
        { id: "oslo-r", name: "Oslo", cities: [{ id: "oslo", name: "Oslo", isCapital: true, localities: [] }] },
      ]},
      { id: "dk", name: "Denmark", code: "DK", flag: "🇩🇰", states: [
        { id: "capital-dk", name: "Capital Region", cities: [{ id: "copenhagen", name: "Copenhagen", isCapital: true, localities: [] }] },
      ]},
      { id: "fi", name: "Finland", code: "FI", flag: "🇫🇮", states: [
        { id: "uusimaa", name: "Uusimaa", cities: [{ id: "helsinki", name: "Helsinki", isCapital: true, localities: [] }] },
      ]},
      { id: "ie", name: "Ireland", code: "IE", flag: "🇮🇪", states: [
        { id: "dublin-c", name: "Dublin", cities: [{ id: "dublin", name: "Dublin", isCapital: true, localities: [{ id: "docklands-ie", name: "Docklands", type: "hub" }] }] },
      ]},
      { id: "pt", name: "Portugal", code: "PT", flag: "🇵🇹", states: [
        { id: "lisbon-d", name: "Lisbon", cities: [{ id: "lisbon", name: "Lisbon", isCapital: true, localities: [] }] },
      ]},
      { id: "pl", name: "Poland", code: "PL", flag: "🇵🇱", states: [
        { id: "masovia", name: "Masovia", cities: [{ id: "warsaw", name: "Warsaw", isCapital: true, localities: [] }] },
        { id: "lesser-poland", name: "Lesser Poland", cities: [{ id: "krakow", name: "Krakow", localities: [] }] },
      ]},
      { id: "cz", name: "Czech Republic", code: "CZ", flag: "🇨🇿", states: [
        { id: "prague-r", name: "Prague", cities: [{ id: "prague", name: "Prague", isCapital: true, localities: [] }] },
      ]},
      { id: "hu", name: "Hungary", code: "HU", flag: "🇭🇺", states: [
        { id: "budapest-c", name: "Budapest", cities: [{ id: "budapest", name: "Budapest", isCapital: true, localities: [] }] },
      ]},
      { id: "gr", name: "Greece", code: "GR", flag: "🇬🇷", states: [
        { id: "attica", name: "Attica", cities: [{ id: "athens", name: "Athens", isCapital: true, localities: [] }] },
      ]},
      { id: "ro", name: "Romania", code: "RO", flag: "🇷🇴", states: [
        { id: "bucharest-if", name: "Bucharest", cities: [{ id: "bucharest", name: "Bucharest", isCapital: true, localities: [] }] },
      ]},
      { id: "bg", name: "Bulgaria", code: "BG", flag: "🇧🇬", states: [
        { id: "sofia-c", name: "Sofia", cities: [{ id: "sofia", name: "Sofia", isCapital: true, localities: [] }] },
      ]},
      { id: "ua", name: "Ukraine", code: "UA", flag: "🇺🇦", states: [
        { id: "kyiv-o", name: "Kyiv", cities: [{ id: "kyiv", name: "Kyiv", isCapital: true, localities: [] }] },
      ]},
      { id: "ru", name: "Russia", code: "RU", flag: "🇷🇺", states: [
        { id: "moscow-o", name: "Moscow", cities: [{ id: "moscow", name: "Moscow", isCapital: true, localities: [] }] },
        { id: "st-petersburg-c", name: "St. Petersburg", cities: [{ id: "st-petersburg", name: "St. Petersburg", localities: [] }] },
      ]},
      { id: "hr", name: "Croatia", code: "HR", flag: "🇭🇷", states: [
        { id: "zagreb-c", name: "Zagreb", cities: [{ id: "zagreb", name: "Zagreb", isCapital: true, localities: [] }] },
      ]},
      { id: "rs", name: "Serbia", code: "RS", flag: "🇷🇸", states: [
        { id: "belgrade-c", name: "Belgrade", cities: [{ id: "belgrade", name: "Belgrade", isCapital: true, localities: [] }] },
      ]},
      { id: "sk", name: "Slovakia", code: "SK", flag: "🇸🇰", states: [
        { id: "bratislava-r", name: "Bratislava", cities: [{ id: "bratislava", name: "Bratislava", isCapital: true, localities: [] }] },
      ]},
      { id: "si", name: "Slovenia", code: "SI", flag: "🇸🇮", states: [
        { id: "central-slovenia", name: "Central Slovenia", cities: [{ id: "ljubljana", name: "Ljubljana", isCapital: true, localities: [] }] },
      ]},
      { id: "lt", name: "Lithuania", code: "LT", flag: "🇱🇹", states: [
        { id: "vilnius-c", name: "Vilnius", cities: [{ id: "vilnius", name: "Vilnius", isCapital: true, localities: [] }] },
      ]},
      { id: "lv", name: "Latvia", code: "LV", flag: "🇱🇻", states: [
        { id: "riga-p", name: "Riga", cities: [{ id: "riga", name: "Riga", isCapital: true, localities: [] }] },
      ]},
      { id: "ee", name: "Estonia", code: "EE", flag: "🇪🇪", states: [
        { id: "harju", name: "Harju", cities: [{ id: "tallinn", name: "Tallinn", isCapital: true, localities: [] }] },
      ]},
      { id: "lu", name: "Luxembourg", code: "LU", flag: "🇱🇺", states: [
        { id: "luxembourg-d", name: "Luxembourg", cities: [{ id: "luxembourg-city", name: "Luxembourg", isCapital: true, localities: [] }] },
      ]},
      { id: "mt", name: "Malta", code: "MT", flag: "🇲🇹", states: [
        { id: "southern-harbour", name: "Southern Harbour", cities: [{ id: "valletta", name: "Valletta", isCapital: true, localities: [] }] },
      ]},
      { id: "mc", name: "Monaco", code: "MC", flag: "🇲🇨", states: [
        { id: "monaco-c", name: "Monaco", cities: [{ id: "monaco", name: "Monaco", isCapital: true, localities: [] }] },
      ]},
      { id: "is", name: "Iceland", code: "IS", flag: "🇮🇸", states: [
        { id: "capital-region-is", name: "Capital Region", cities: [{ id: "reykjavik", name: "Reykjavik", isCapital: true, localities: [] }] },
      ]},
      { id: "al", name: "Albania", code: "AL", flag: "🇦🇱", states: [
        { id: "tirana-c", name: "Tirana", cities: [{ id: "tirana", name: "Tirana", isCapital: true, localities: [] }] },
      ]},
      { id: "mk", name: "North Macedonia", code: "MK", flag: "🇲🇰", states: [
        { id: "skopje-r", name: "Skopje", cities: [{ id: "skopje", name: "Skopje", isCapital: true, localities: [] }] },
      ]},
      { id: "me", name: "Montenegro", code: "ME", flag: "🇲🇪", states: [
        { id: "podgorica-m", name: "Podgorica", cities: [{ id: "podgorica", name: "Podgorica", isCapital: true, localities: [] }] },
      ]},
      { id: "ba", name: "Bosnia and Herzegovina", code: "BA", flag: "🇧🇦", states: [
        { id: "sarajevo-c", name: "Sarajevo", cities: [{ id: "sarajevo", name: "Sarajevo", isCapital: true, localities: [] }] },
      ]},
      { id: "xk", name: "Kosovo", code: "XK", flag: "🇽🇰", states: [
        { id: "pristina-d", name: "Pristina", cities: [{ id: "pristina", name: "Pristina", isCapital: true, localities: [] }] },
      ]},
      { id: "md", name: "Moldova", code: "MD", flag: "🇲🇩", states: [
        { id: "chisinau-m", name: "Chișinău", cities: [{ id: "chisinau", name: "Chișinău", isCapital: true, localities: [] }] },
      ]},
      { id: "by", name: "Belarus", code: "BY", flag: "🇧🇾", states: [
        { id: "minsk-c", name: "Minsk", cities: [{ id: "minsk", name: "Minsk", isCapital: true, localities: [] }] },
      ]},
      { id: "ad", name: "Andorra", code: "AD", flag: "🇦🇩", states: [
        { id: "andorra-la-vella-p", name: "Andorra la Vella", cities: [{ id: "andorra-la-vella", name: "Andorra la Vella", isCapital: true, localities: [] }] },
      ]},
      { id: "li", name: "Liechtenstein", code: "LI", flag: "🇱🇮", states: [
        { id: "vaduz-m", name: "Vaduz", cities: [{ id: "vaduz", name: "Vaduz", isCapital: true, localities: [] }] },
      ]},
      { id: "sm", name: "San Marino", code: "SM", flag: "🇸🇲", states: [
        { id: "san-marino-c", name: "San Marino", cities: [{ id: "san-marino", name: "San Marino", isCapital: true, localities: [] }] },
      ]},
      { id: "va", name: "Vatican City", code: "VA", flag: "🇻🇦", states: [
        { id: "vatican-c", name: "Vatican", cities: [{ id: "vatican-city", name: "Vatican City", isCapital: true, localities: [] }] },
      ]},
    ],
  },
  {
    id: "north-america",
    name: "North America",
    countries: [
      { id: "us", name: "United States", code: "US", flag: "🇺🇸", states: [
        { id: "ca-us", name: "California", code: "CA", cities: [{ id: "sf", name: "San Francisco", localities: [{ id: "soma", name: "SoMa", type: "hub" }, { id: "fidi", name: "Financial District", type: "hub" }] }, { id: "la", name: "Los Angeles", localities: [{ id: "hollywood", name: "Hollywood", type: "district" }, { id: "dtla", name: "Downtown LA", type: "hub" }] }, { id: "sanjose", name: "San Jose", localities: [] }, { id: "san-diego", name: "San Diego", localities: [] }] },
        { id: "ny-us", name: "New York", code: "NY", cities: [{ id: "nyc", name: "New York City", localities: [{ id: "manhattan", name: "Manhattan", type: "hub" }, { id: "wall-street", name: "Wall Street", type: "hub" }, { id: "brooklyn", name: "Brooklyn", type: "district" }] }] },
        { id: "tx", name: "Texas", code: "TX", cities: [{ id: "austin", name: "Austin", isCapital: true, localities: [] }, { id: "houston", name: "Houston", localities: [{ id: "energy-corridor", name: "Energy Corridor", type: "hub" }] }, { id: "dallas", name: "Dallas", localities: [] }, { id: "san-antonio", name: "San Antonio", localities: [] }] },
        { id: "wa-us", name: "Washington", code: "WA", cities: [{ id: "seattle", name: "Seattle", localities: [{ id: "south-lake-union", name: "South Lake Union", type: "hub" }] }] },
        { id: "ma", name: "Massachusetts", code: "MA", cities: [{ id: "boston", name: "Boston", isCapital: true, localities: [{ id: "cambridge", name: "Cambridge", type: "hub" }] }] },
        { id: "fl", name: "Florida", code: "FL", cities: [{ id: "miami", name: "Miami", localities: [] }, { id: "orlando", name: "Orlando", localities: [] }] },
        { id: "il", name: "Illinois", code: "IL", cities: [{ id: "chicago", name: "Chicago", localities: [] }] },
        { id: "dc-us", name: "Washington D.C.", code: "DC", cities: [{ id: "washington", name: "Washington D.C.", isCapital: true, localities: [{ id: "capitol-hill", name: "Capitol Hill", type: "capital" }] }] },
        { id: "ga-us", name: "Georgia", code: "GA", cities: [{ id: "atlanta", name: "Atlanta", isCapital: true, localities: [] }] },
        { id: "co", name: "Colorado", code: "CO", cities: [{ id: "denver", name: "Denver", isCapital: true, localities: [] }] },
        { id: "az", name: "Arizona", code: "AZ", cities: [{ id: "phoenix", name: "Phoenix", isCapital: true, localities: [] }] },
        { id: "pa", name: "Pennsylvania", code: "PA", cities: [{ id: "philadelphia", name: "Philadelphia", localities: [] }] },
        { id: "nv", name: "Nevada", code: "NV", cities: [{ id: "las-vegas", name: "Las Vegas", localities: [] }] },
      ]},
      { id: "ca-country", name: "Canada", code: "CA", flag: "🇨🇦", states: [
        { id: "ontario", name: "Ontario", cities: [{ id: "toronto", name: "Toronto", localities: [{ id: "bay-street", name: "Bay Street", type: "hub" }] }, { id: "ottawa", name: "Ottawa", isCapital: true, localities: [] }] },
        { id: "bc", name: "British Columbia", cities: [{ id: "vancouver", name: "Vancouver", localities: [] }] },
        { id: "quebec-p", name: "Quebec", cities: [{ id: "montreal", name: "Montreal", localities: [] }] },
        { id: "alberta", name: "Alberta", cities: [{ id: "calgary", name: "Calgary", localities: [] }] },
      ]},
      { id: "mx", name: "Mexico", code: "MX", flag: "🇲🇽", states: [
        { id: "cdmx", name: "Mexico City", cities: [{ id: "mexico-city", name: "Mexico City", isCapital: true, localities: [{ id: "polanco", name: "Polanco", type: "hub" }] }] },
        { id: "jalisco", name: "Jalisco", cities: [{ id: "guadalajara", name: "Guadalajara", localities: [] }] },
        { id: "nuevo-leon", name: "Nuevo León", cities: [{ id: "monterrey", name: "Monterrey", localities: [] }] },
      ]},
      { id: "cu", name: "Cuba", code: "CU", flag: "🇨🇺", states: [
        { id: "havana-p", name: "Havana", cities: [{ id: "havana", name: "Havana", isCapital: true, localities: [] }] },
      ]},
      { id: "do", name: "Dominican Republic", code: "DO", flag: "🇩🇴", states: [
        { id: "santo-domingo-dn", name: "Nacional", cities: [{ id: "santo-domingo", name: "Santo Domingo", isCapital: true, localities: [] }] },
      ]},
      { id: "ht", name: "Haiti", code: "HT", flag: "🇭🇹", states: [
        { id: "ouest", name: "Ouest", cities: [{ id: "port-au-prince", name: "Port-au-Prince", isCapital: true, localities: [] }] },
      ]},
      { id: "jm", name: "Jamaica", code: "JM", flag: "🇯🇲", states: [
        { id: "surrey-jm", name: "Surrey", cities: [{ id: "kingston", name: "Kingston", isCapital: true, localities: [] }] },
      ]},
      { id: "tt", name: "Trinidad and Tobago", code: "TT", flag: "🇹🇹", states: [
        { id: "port-of-spain-r", name: "Port of Spain", cities: [{ id: "port-of-spain", name: "Port of Spain", isCapital: true, localities: [] }] },
      ]},
      { id: "bs", name: "Bahamas", code: "BS", flag: "🇧🇸", states: [
        { id: "new-providence", name: "New Providence", cities: [{ id: "nassau", name: "Nassau", isCapital: true, localities: [] }] },
      ]},
      { id: "bb", name: "Barbados", code: "BB", flag: "🇧🇧", states: [
        { id: "st-michael", name: "St. Michael", cities: [{ id: "bridgetown", name: "Bridgetown", isCapital: true, localities: [] }] },
      ]},
      { id: "pa", name: "Panama", code: "PA", flag: "🇵🇦", states: [
        { id: "panama-p", name: "Panamá", cities: [{ id: "panama-city", name: "Panama City", isCapital: true, localities: [] }] },
      ]},
      { id: "cr", name: "Costa Rica", code: "CR", flag: "🇨🇷", states: [
        { id: "san-jose-p", name: "San José", cities: [{ id: "san-jose-cr", name: "San José", isCapital: true, localities: [] }] },
      ]},
      { id: "gt", name: "Guatemala", code: "GT", flag: "🇬🇹", states: [
        { id: "guatemala-d", name: "Guatemala", cities: [{ id: "guatemala-city", name: "Guatemala City", isCapital: true, localities: [] }] },
      ]},
      { id: "hn", name: "Honduras", code: "HN", flag: "🇭🇳", states: [
        { id: "fm", name: "Francisco Morazán", cities: [{ id: "tegucigalpa", name: "Tegucigalpa", isCapital: true, localities: [] }] },
      ]},
      { id: "sv", name: "El Salvador", code: "SV", flag: "🇸🇻", states: [
        { id: "san-salvador-d", name: "San Salvador", cities: [{ id: "san-salvador", name: "San Salvador", isCapital: true, localities: [] }] },
      ]},
      { id: "ni", name: "Nicaragua", code: "NI", flag: "🇳🇮", states: [
        { id: "managua-d", name: "Managua", cities: [{ id: "managua", name: "Managua", isCapital: true, localities: [] }] },
      ]},
      { id: "bz", name: "Belize", code: "BZ", flag: "🇧🇿", states: [
        { id: "belize-d", name: "Belize", cities: [{ id: "belmopan", name: "Belmopan", isCapital: true, localities: [] }] },
      ]},
      { id: "ag", name: "Antigua and Barbuda", code: "AG", flag: "🇦🇬", states: [
        { id: "st-john-ag", name: "St. John", cities: [{ id: "st-johns-ag", name: "St. John's", isCapital: true, localities: [] }] },
      ]},
      { id: "lc", name: "Saint Lucia", code: "LC", flag: "🇱🇨", states: [
        { id: "castries-q", name: "Castries", cities: [{ id: "castries", name: "Castries", isCapital: true, localities: [] }] },
      ]},
      { id: "gd", name: "Grenada", code: "GD", flag: "🇬🇩", states: [
        { id: "st-george-gd", name: "St. George", cities: [{ id: "st-georges", name: "St. George's", isCapital: true, localities: [] }] },
      ]},
      { id: "vc", name: "Saint Vincent and the Grenadines", code: "VC", flag: "🇻🇨", states: [
        { id: "charlotte-vc", name: "Charlotte", cities: [{ id: "kingstown", name: "Kingstown", isCapital: true, localities: [] }] },
      ]},
      { id: "dm", name: "Dominica", code: "DM", flag: "🇩🇲", states: [
        { id: "st-george-dm", name: "St. George", cities: [{ id: "roseau", name: "Roseau", isCapital: true, localities: [] }] },
      ]},
      { id: "kn", name: "Saint Kitts and Nevis", code: "KN", flag: "🇰🇳", states: [
        { id: "basseterre-p", name: "Basseterre", cities: [{ id: "basseterre", name: "Basseterre", isCapital: true, localities: [] }] },
      ]},
    ],
  },
  {
    id: "south-america",
    name: "South America",
    countries: [
      { id: "br", name: "Brazil", code: "BR", flag: "🇧🇷", states: [
        { id: "sao-paulo-s", name: "São Paulo", cities: [{ id: "sao-paulo", name: "São Paulo", localities: [{ id: "faria-lima", name: "Faria Lima", type: "hub" }] }] },
        { id: "rio-s", name: "Rio de Janeiro", cities: [{ id: "rio", name: "Rio de Janeiro", localities: [] }] },
        { id: "df-br", name: "Distrito Federal", cities: [{ id: "brasilia", name: "Brasília", isCapital: true, localities: [] }] },
        { id: "minas-gerais", name: "Minas Gerais", cities: [{ id: "belo-horizonte", name: "Belo Horizonte", localities: [] }] },
      ]},
      { id: "ar", name: "Argentina", code: "AR", flag: "🇦🇷", states: [
        { id: "buenos-aires-p", name: "Buenos Aires", cities: [{ id: "buenos-aires", name: "Buenos Aires", isCapital: true, localities: [{ id: "puerto-madero", name: "Puerto Madero", type: "hub" }] }] },
        { id: "cordoba-ar", name: "Córdoba", cities: [{ id: "cordoba", name: "Córdoba", localities: [] }] },
      ]},
      { id: "cl", name: "Chile", code: "CL", flag: "🇨🇱", states: [
        { id: "santiago-r", name: "Santiago Metropolitan", cities: [{ id: "santiago", name: "Santiago", isCapital: true, localities: [] }] },
      ]},
      { id: "co", name: "Colombia", code: "CO", flag: "🇨🇴", states: [
        { id: "bogota-d", name: "Bogotá D.C.", cities: [{ id: "bogota", name: "Bogotá", isCapital: true, localities: [] }] },
        { id: "antioquia", name: "Antioquia", cities: [{ id: "medellin", name: "Medellín", localities: [] }] },
      ]},
      { id: "pe", name: "Peru", code: "PE", flag: "🇵🇪", states: [
        { id: "lima-p", name: "Lima", cities: [{ id: "lima", name: "Lima", isCapital: true, localities: [] }] },
      ]},
      { id: "ve", name: "Venezuela", code: "VE", flag: "🇻🇪", states: [
        { id: "capital-ve", name: "Capital District", cities: [{ id: "caracas", name: "Caracas", isCapital: true, localities: [] }] },
      ]},
      { id: "ec", name: "Ecuador", code: "EC", flag: "🇪🇨", states: [
        { id: "pichincha", name: "Pichincha", cities: [{ id: "quito", name: "Quito", isCapital: true, localities: [] }] },
      ]},
      { id: "bo", name: "Bolivia", code: "BO", flag: "🇧🇴", states: [
        { id: "la-paz-d", name: "La Paz", cities: [{ id: "la-paz", name: "La Paz", isCapital: true, localities: [] }] },
      ]},
      { id: "py", name: "Paraguay", code: "PY", flag: "🇵🇾", states: [
        { id: "asuncion-d", name: "Asunción", cities: [{ id: "asuncion", name: "Asunción", isCapital: true, localities: [] }] },
      ]},
      { id: "uy", name: "Uruguay", code: "UY", flag: "🇺🇾", states: [
        { id: "montevideo-d", name: "Montevideo", cities: [{ id: "montevideo", name: "Montevideo", isCapital: true, localities: [] }] },
      ]},
      { id: "gy", name: "Guyana", code: "GY", flag: "🇬🇾", states: [
        { id: "demerara-mahaica", name: "Demerara-Mahaica", cities: [{ id: "georgetown", name: "Georgetown", isCapital: true, localities: [] }] },
      ]},
      { id: "sr", name: "Suriname", code: "SR", flag: "🇸🇷", states: [
        { id: "paramaribo-d", name: "Paramaribo", cities: [{ id: "paramaribo", name: "Paramaribo", isCapital: true, localities: [] }] },
      ]},
    ],
  },
  {
    id: "oceania",
    name: "Oceania",
    countries: [
      { id: "au", name: "Australia", code: "AU", flag: "🇦🇺", states: [
        { id: "nsw", name: "New South Wales", code: "NSW", cities: [{ id: "sydney", name: "Sydney", localities: [{ id: "cbd-sydney", name: "CBD", type: "hub" }] }] },
        { id: "vic", name: "Victoria", code: "VIC", cities: [{ id: "melbourne", name: "Melbourne", localities: [{ id: "docklands", name: "Docklands", type: "hub" }] }] },
        { id: "qld", name: "Queensland", code: "QLD", cities: [{ id: "brisbane", name: "Brisbane", localities: [] }] },
        { id: "wa-au", name: "Western Australia", code: "WA", cities: [{ id: "perth", name: "Perth", localities: [] }] },
        { id: "sa-au", name: "South Australia", code: "SA", cities: [{ id: "adelaide", name: "Adelaide", localities: [] }] },
        { id: "act", name: "Australian Capital Territory", code: "ACT", cities: [{ id: "canberra", name: "Canberra", isCapital: true, localities: [] }] },
      ]},
      { id: "nz", name: "New Zealand", code: "NZ", flag: "🇳🇿", states: [
        { id: "auckland-r", name: "Auckland", cities: [{ id: "auckland", name: "Auckland", localities: [] }] },
        { id: "wellington-r", name: "Wellington", cities: [{ id: "wellington", name: "Wellington", isCapital: true, localities: [] }] },
      ]},
      { id: "fj", name: "Fiji", code: "FJ", flag: "🇫🇯", states: [
        { id: "central-fj", name: "Central", cities: [{ id: "suva", name: "Suva", isCapital: true, localities: [] }] },
      ]},
      { id: "pg", name: "Papua New Guinea", code: "PG", flag: "🇵🇬", states: [
        { id: "ncd", name: "National Capital District", cities: [{ id: "port-moresby", name: "Port Moresby", isCapital: true, localities: [] }] },
      ]},
      { id: "sb", name: "Solomon Islands", code: "SB", flag: "🇸🇧", states: [
        { id: "honiara-c", name: "Honiara", cities: [{ id: "honiara", name: "Honiara", isCapital: true, localities: [] }] },
      ]},
      { id: "vu", name: "Vanuatu", code: "VU", flag: "🇻🇺", states: [
        { id: "shefa", name: "Shefa", cities: [{ id: "port-vila", name: "Port Vila", isCapital: true, localities: [] }] },
      ]},
      { id: "ws", name: "Samoa", code: "WS", flag: "🇼🇸", states: [
        { id: "tuamasaga", name: "Tuamasaga", cities: [{ id: "apia", name: "Apia", isCapital: true, localities: [] }] },
      ]},
      { id: "to", name: "Tonga", code: "TO", flag: "🇹🇴", states: [
        { id: "tongatapu", name: "Tongatapu", cities: [{ id: "nukualofa", name: "Nuku'alofa", isCapital: true, localities: [] }] },
      ]},
      { id: "ki", name: "Kiribati", code: "KI", flag: "🇰🇮", states: [
        { id: "south-tarawa", name: "South Tarawa", cities: [{ id: "tarawa", name: "Tarawa", isCapital: true, localities: [] }] },
      ]},
      { id: "fm", name: "Micronesia", code: "FM", flag: "🇫🇲", states: [
        { id: "pohnpei-s", name: "Pohnpei", cities: [{ id: "palikir", name: "Palikir", isCapital: true, localities: [] }] },
      ]},
      { id: "mh", name: "Marshall Islands", code: "MH", flag: "🇲🇭", states: [
        { id: "majuro-a", name: "Majuro", cities: [{ id: "majuro", name: "Majuro", isCapital: true, localities: [] }] },
      ]},
      { id: "pw", name: "Palau", code: "PW", flag: "🇵🇼", states: [
        { id: "ngerulmud-s", name: "Melekeok", cities: [{ id: "ngerulmud", name: "Ngerulmud", isCapital: true, localities: [] }] },
      ]},
      { id: "nr", name: "Nauru", code: "NR", flag: "🇳🇷", states: [
        { id: "yaren-d", name: "Yaren", cities: [{ id: "yaren", name: "Yaren", isCapital: true, localities: [] }] },
      ]},
      { id: "tv", name: "Tuvalu", code: "TV", flag: "🇹🇻", states: [
        { id: "funafuti-a", name: "Funafuti", cities: [{ id: "funafuti", name: "Funafuti", isCapital: true, localities: [] }] },
      ]},
    ],
  },
  {
    id: "antarctica",
    name: "Antarctica",
    countries: [], // No permanent population
  },
];

// Helper functions
export function getContinentById(id: string): Continent | undefined {
  return GEO_HIERARCHY.find(c => c.id === id);
}

export function getCountryById(id: string): Country | undefined {
  for (const continent of GEO_HIERARCHY) {
    const country = continent.countries.find(c => c.id === id);
    if (country) return country;
  }
  return undefined;
}

export function getCountryByCode(code: string): Country | undefined {
  for (const continent of GEO_HIERARCHY) {
    const country = continent.countries.find(c => c.code.toLowerCase() === code.toLowerCase());
    if (country) return country;
  }
  return undefined;
}

export function getStateById(countryId: string, stateId: string): State | undefined {
  const country = getCountryById(countryId);
  return country?.states.find(s => s.id === stateId);
}

export function getCityById(countryId: string, stateId: string, cityId: string): City | undefined {
  const state = getStateById(countryId, stateId);
  return state?.cities.find(c => c.id === cityId);
}

export function getAllCountries(): Country[] {
  return GEO_HIERARCHY.flatMap(continent => continent.countries);
}

export function getContinentForCountry(countryCode: string): Continent | undefined {
  return GEO_HIERARCHY.find(continent => 
    continent.countries.some(c => c.code.toLowerCase() === countryCode.toLowerCase())
  );
}

// Map country codes to continent IDs for filtering
export const COUNTRY_TO_CONTINENT: Record<string, string> = {};
GEO_HIERARCHY.forEach(continent => {
  continent.countries.forEach(country => {
    COUNTRY_TO_CONTINENT[country.code.toUpperCase()] = continent.id;
  });
});

// Export continent list for quick access with real country counts
export const CONTINENTS = GEO_HIERARCHY.map(c => ({ 
  id: c.id, 
  name: c.name, 
  countryCount: c.countries.length 
}));

// Search interface for locations
export interface SearchResult {
  type: "continent" | "country" | "state" | "city" | "locality";
  id: string;
  name: string;
  path: string[];
  flag?: string;
  continentId?: string;
  countryId?: string;
  countryCode?: string;
  stateId?: string;
  cityId?: string;
}

// Search function across all locations
export function searchLocations(query: string, limit: number = 20): SearchResult[] {
  if (!query || query.length < 2) return [];
  
  const results: SearchResult[] = [];
  const q = query.toLowerCase();
  
  for (const continent of GEO_HIERARCHY) {
    // Search continents
    if (continent.name.toLowerCase().includes(q)) {
      results.push({
        type: "continent",
        id: continent.id,
        name: continent.name,
        path: [continent.name],
      });
    }
    
    for (const country of continent.countries) {
      // Search countries
      if (country.name.toLowerCase().includes(q) || country.code.toLowerCase() === q) {
        results.push({
          type: "country",
          id: country.id,
          name: country.name,
          path: [continent.name, country.name],
          flag: country.flag,
          continentId: continent.id,
          countryCode: country.code,
        });
      }
      
      for (const state of country.states) {
        // Search states
        if (state.name.toLowerCase().includes(q)) {
          results.push({
            type: "state",
            id: state.id,
            name: state.name,
            path: [continent.name, country.name, state.name],
            flag: country.flag,
            continentId: continent.id,
            countryId: country.id,
            countryCode: country.code,
          });
        }
        
        for (const city of state.cities) {
          // Search cities
          if (city.name.toLowerCase().includes(q)) {
            results.push({
              type: "city",
              id: city.id,
              name: city.name,
              path: [continent.name, country.name, state.name, city.name],
              flag: country.flag,
              continentId: continent.id,
              countryId: country.id,
              countryCode: country.code,
              stateId: state.id,
            });
          }
          
          for (const locality of city.localities) {
            // Search localities
            if (locality.name.toLowerCase().includes(q)) {
              results.push({
                type: "locality",
                id: locality.id,
                name: locality.name,
                path: [continent.name, country.name, state.name, city.name, locality.name],
                flag: country.flag,
                continentId: continent.id,
                countryId: country.id,
                countryCode: country.code,
                stateId: state.id,
                cityId: city.id,
              });
            }
          }
        }
      }
    }
    
    if (results.length >= limit) break;
  }
  
  return results.slice(0, limit);
}

// Find location by coordinates (reverse geocoding placeholder)
export function findLocationByCoordinates(lat: number, lng: number): { 
  countryCode?: string; 
  country?: Country;
  continent?: Continent;
} | null {
  // This is a simplified lookup - in production you'd use a proper reverse geocoding API
  // For now, we'll return based on rough coordinate ranges
  
  // India bounds (roughly)
  if (lat >= 8 && lat <= 35 && lng >= 68 && lng <= 97) {
    return {
      countryCode: "IN",
      country: getCountryByCode("IN"),
      continent: getContinentById("asia"),
    };
  }
  
  // US bounds (roughly - continental)
  if (lat >= 24 && lat <= 49 && lng >= -125 && lng <= -66) {
    return {
      countryCode: "US",
      country: getCountryByCode("US"),
      continent: getContinentById("north-america"),
    };
  }
  
  // UK bounds
  if (lat >= 50 && lat <= 60 && lng >= -8 && lng <= 2) {
    return {
      countryCode: "GB",
      country: getCountryByCode("GB"),
      continent: getContinentById("europe"),
    };
  }
  
  // Australia bounds
  if (lat >= -44 && lat <= -10 && lng >= 112 && lng <= 154) {
    return {
      countryCode: "AU",
      country: getCountryByCode("AU"),
      continent: getContinentById("oceania"),
    };
  }
  
  // Japan bounds
  if (lat >= 24 && lat <= 46 && lng >= 123 && lng <= 146) {
    return {
      countryCode: "JP",
      country: getCountryByCode("JP"),
      continent: getContinentById("asia"),
    };
  }
  
  // Germany bounds
  if (lat >= 47 && lat <= 55 && lng >= 5 && lng <= 15) {
    return {
      countryCode: "DE",
      country: getCountryByCode("DE"),
      continent: getContinentById("europe"),
    };
  }
  
  // France bounds
  if (lat >= 41 && lat <= 51 && lng >= -5 && lng <= 10) {
    return {
      countryCode: "FR",
      country: getCountryByCode("FR"),
      continent: getContinentById("europe"),
    };
  }
  
  // China bounds
  if (lat >= 18 && lat <= 54 && lng >= 73 && lng <= 135) {
    return {
      countryCode: "CN",
      country: getCountryByCode("CN"),
      continent: getContinentById("asia"),
    };
  }
  
  // Brazil bounds
  if (lat >= -34 && lat <= 5 && lng >= -74 && lng <= -34) {
    return {
      countryCode: "BR",
      country: getCountryByCode("BR"),
      continent: getContinentById("south-america"),
    };
  }
  
  // UAE bounds
  if (lat >= 22 && lat <= 26 && lng >= 51 && lng <= 56) {
    return {
      countryCode: "AE",
      country: getCountryByCode("AE"),
      continent: getContinentById("asia"),
    };
  }
  
  // Singapore bounds
  if (lat >= 1 && lat <= 1.5 && lng >= 103 && lng <= 104) {
    return {
      countryCode: "SG",
      country: getCountryByCode("SG"),
      continent: getContinentById("asia"),
    };
  }
  
  return null;
}

// Get summary stats
export function getGeoStats(): { 
  totalContinents: number; 
  totalCountries: number; 
  totalStates: number; 
  totalCities: number; 
} {
  let totalStates = 0;
  let totalCities = 0;
  
  for (const continent of GEO_HIERARCHY) {
    for (const country of continent.countries) {
      totalStates += country.states.length;
      for (const state of country.states) {
        totalCities += state.cities.length;
      }
    }
  }
  
  return {
    totalContinents: GEO_HIERARCHY.length,
    totalCountries: getAllCountries().length,
    totalStates,
    totalCities,
  };
}
