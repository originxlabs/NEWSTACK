// World Countries Configuration with Regional Languages, Flags, and Capitals
// This file provides metadata for countries including their provinces/states, languages, and flags

export interface CountryLanguage {
  code: string;
  name: string;
  nativeName: string;
  script?: string;
}

export interface CountryConfig {
  code: string;
  name: string;
  flag: string;
  capital: string;
  capitalFlag?: string;
  languages: CountryLanguage[];
  provinces?: ProvinceConfig[];
  currency?: string;
  region: string;
  tier: "local" | "national" | "global";
}

export interface ProvinceConfig {
  id: string;
  name: string;
  capital?: string;
  flag?: string;
  language?: string;
  majorCities?: string[];
}

// Country language mapping
export const COUNTRY_LANGUAGES: Record<string, CountryLanguage[]> = {
  US: [
    { code: "en", name: "English", nativeName: "English" },
    { code: "es", name: "Spanish", nativeName: "Español" },
  ],
  GB: [
    { code: "en", name: "English", nativeName: "English" },
    { code: "cy", name: "Welsh", nativeName: "Cymraeg" },
    { code: "gd", name: "Scottish Gaelic", nativeName: "Gàidhlig" },
  ],
  IN: [
    { code: "hi", name: "Hindi", nativeName: "हिन्दी", script: "Devanagari" },
    { code: "en", name: "English", nativeName: "English" },
    { code: "bn", name: "Bengali", nativeName: "বাংলা", script: "Bengali" },
    { code: "te", name: "Telugu", nativeName: "తెలుగు", script: "Telugu" },
    { code: "mr", name: "Marathi", nativeName: "मराठी", script: "Devanagari" },
    { code: "ta", name: "Tamil", nativeName: "தமிழ்", script: "Tamil" },
    { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", script: "Gujarati" },
    { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", script: "Kannada" },
    { code: "ml", name: "Malayalam", nativeName: "മലയാളം", script: "Malayalam" },
    { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ", script: "Odia" },
    { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", script: "Gurmukhi" },
    { code: "as", name: "Assamese", nativeName: "অসমীয়া", script: "Bengali" },
  ],
  CN: [
    { code: "zh", name: "Chinese", nativeName: "中文", script: "Simplified Han" },
    { code: "yue", name: "Cantonese", nativeName: "粵語" },
  ],
  JP: [
    { code: "ja", name: "Japanese", nativeName: "日本語", script: "Japanese" },
  ],
  DE: [
    { code: "de", name: "German", nativeName: "Deutsch" },
  ],
  FR: [
    { code: "fr", name: "French", nativeName: "Français" },
  ],
  ES: [
    { code: "es", name: "Spanish", nativeName: "Español" },
    { code: "ca", name: "Catalan", nativeName: "Català" },
    { code: "eu", name: "Basque", nativeName: "Euskara" },
    { code: "gl", name: "Galician", nativeName: "Galego" },
  ],
  IT: [
    { code: "it", name: "Italian", nativeName: "Italiano" },
  ],
  BR: [
    { code: "pt", name: "Portuguese", nativeName: "Português" },
  ],
  RU: [
    { code: "ru", name: "Russian", nativeName: "Русский", script: "Cyrillic" },
  ],
  AE: [
    { code: "ar", name: "Arabic", nativeName: "العربية", script: "Arabic" },
    { code: "en", name: "English", nativeName: "English" },
  ],
  SA: [
    { code: "ar", name: "Arabic", nativeName: "العربية", script: "Arabic" },
  ],
  ID: [
    { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia" },
  ],
  PK: [
    { code: "ur", name: "Urdu", nativeName: "اردو", script: "Arabic" },
    { code: "en", name: "English", nativeName: "English" },
  ],
  BD: [
    { code: "bn", name: "Bengali", nativeName: "বাংলা", script: "Bengali" },
  ],
  NG: [
    { code: "en", name: "English", nativeName: "English" },
    { code: "yo", name: "Yoruba", nativeName: "Yorùbá" },
    { code: "ha", name: "Hausa", nativeName: "Hausa" },
    { code: "ig", name: "Igbo", nativeName: "Igbo" },
  ],
  EG: [
    { code: "ar", name: "Arabic", nativeName: "العربية", script: "Arabic" },
  ],
  ZA: [
    { code: "en", name: "English", nativeName: "English" },
    { code: "af", name: "Afrikaans", nativeName: "Afrikaans" },
    { code: "zu", name: "Zulu", nativeName: "isiZulu" },
    { code: "xh", name: "Xhosa", nativeName: "isiXhosa" },
  ],
  AU: [
    { code: "en", name: "English", nativeName: "English" },
  ],
  CA: [
    { code: "en", name: "English", nativeName: "English" },
    { code: "fr", name: "French", nativeName: "Français" },
  ],
  MX: [
    { code: "es", name: "Spanish", nativeName: "Español" },
  ],
  KR: [
    { code: "ko", name: "Korean", nativeName: "한국어", script: "Hangul" },
  ],
  TH: [
    { code: "th", name: "Thai", nativeName: "ไทย", script: "Thai" },
  ],
  VN: [
    { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt" },
  ],
  MY: [
    { code: "ms", name: "Malay", nativeName: "Bahasa Melayu" },
    { code: "en", name: "English", nativeName: "English" },
    { code: "zh", name: "Chinese", nativeName: "中文" },
    { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  ],
  SG: [
    { code: "en", name: "English", nativeName: "English" },
    { code: "zh", name: "Chinese", nativeName: "中文" },
    { code: "ms", name: "Malay", nativeName: "Bahasa Melayu" },
    { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  ],
  PH: [
    { code: "tl", name: "Filipino", nativeName: "Filipino" },
    { code: "en", name: "English", nativeName: "English" },
  ],
  NL: [
    { code: "nl", name: "Dutch", nativeName: "Nederlands" },
  ],
  SE: [
    { code: "sv", name: "Swedish", nativeName: "Svenska" },
  ],
  NO: [
    { code: "no", name: "Norwegian", nativeName: "Norsk" },
  ],
  DK: [
    { code: "da", name: "Danish", nativeName: "Dansk" },
  ],
  FI: [
    { code: "fi", name: "Finnish", nativeName: "Suomi" },
    { code: "sv", name: "Swedish", nativeName: "Svenska" },
  ],
  PL: [
    { code: "pl", name: "Polish", nativeName: "Polski" },
  ],
  UA: [
    { code: "uk", name: "Ukrainian", nativeName: "Українська", script: "Cyrillic" },
  ],
  TR: [
    { code: "tr", name: "Turkish", nativeName: "Türkçe" },
  ],
  IL: [
    { code: "he", name: "Hebrew", nativeName: "עברית", script: "Hebrew" },
    { code: "ar", name: "Arabic", nativeName: "العربية" },
  ],
  IR: [
    { code: "fa", name: "Persian", nativeName: "فارسی", script: "Arabic" },
  ],
  IQ: [
    { code: "ar", name: "Arabic", nativeName: "العربية", script: "Arabic" },
    { code: "ku", name: "Kurdish", nativeName: "کوردی" },
  ],
};

// RSS feed sources by country for local news
export const COUNTRY_LOCAL_RSS: Record<string, { name: string; url: string; language: string; region?: string }[]> = {
  US: [
    { name: "CNN", url: "http://rss.cnn.com/rss/cnn_topstories.rss", language: "en" },
    { name: "New York Times", url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml", language: "en" },
    { name: "Washington Post", url: "https://feeds.washingtonpost.com/rss/world", language: "en" },
    { name: "AP News", url: "https://rsshub.app/apnews/topics/world-news", language: "en" },
  ],
  GB: [
    { name: "BBC News", url: "https://feeds.bbci.co.uk/news/rss.xml", language: "en" },
    { name: "The Guardian", url: "https://www.theguardian.com/world/rss", language: "en" },
    { name: "The Telegraph", url: "https://www.telegraph.co.uk/news/rss.xml", language: "en" },
  ],
  DE: [
    { name: "Deutsche Welle", url: "https://rss.dw.com/xml/rss-de-all", language: "de" },
    { name: "Der Spiegel", url: "https://www.spiegel.de/schlagzeilen/index.rss", language: "de" },
    { name: "FAZ", url: "https://www.faz.net/rss/aktuell/", language: "de" },
  ],
  FR: [
    { name: "Le Monde", url: "https://www.lemonde.fr/rss/une.xml", language: "fr" },
    { name: "Le Figaro", url: "https://www.lefigaro.fr/rss/figaro_actualites.xml", language: "fr" },
    { name: "France 24", url: "https://www.france24.com/fr/rss", language: "fr" },
  ],
  JP: [
    { name: "NHK World", url: "https://www3.nhk.or.jp/rss/news/cat0.xml", language: "ja" },
    { name: "Japan Times", url: "https://www.japantimes.co.jp/feed/", language: "en" },
    { name: "Asahi Shimbun", url: "https://www.asahi.com/rss/asahi/newsheadlines.rdf", language: "ja" },
  ],
  CN: [
    { name: "China Daily", url: "https://www.chinadaily.com.cn/rss/china_rss.xml", language: "en" },
    { name: "Xinhua", url: "http://www.xinhuanet.com/english/rss/worldrss.xml", language: "en" },
    { name: "CGTN", url: "https://www.cgtn.com/subscribe/rss/section/world.xml", language: "en" },
  ],
  AU: [
    { name: "ABC News", url: "https://www.abc.net.au/news/feed/51120/rss.xml", language: "en" },
    { name: "Sydney Morning Herald", url: "https://www.smh.com.au/rss/feed.xml", language: "en" },
    { name: "The Australian", url: "https://www.theaustralian.com.au/feed/", language: "en" },
  ],
  CA: [
    { name: "CBC News", url: "https://www.cbc.ca/cmlink/rss-world", language: "en" },
    { name: "Globe and Mail", url: "https://www.theglobeandmail.com/arc/outboundfeeds/rss/category/world/", language: "en" },
    { name: "Radio-Canada", url: "https://ici.radio-canada.ca/rss/4159", language: "fr" },
  ],
  BR: [
    { name: "Folha de São Paulo", url: "https://feeds.folha.uol.com.br/mundo/rss091.xml", language: "pt" },
    { name: "O Globo", url: "https://oglobo.globo.com/rss/oglobo_mundo.xml", language: "pt" },
    { name: "Estadão", url: "https://www.estadao.com.br/arc/outboundfeeds/rss/?outputType=xml", language: "pt" },
  ],
  RU: [
    { name: "RT", url: "https://www.rt.com/rss/", language: "en" },
    { name: "TASS", url: "https://tass.com/rss/v2.xml", language: "en" },
  ],
  AE: [
    { name: "Gulf News", url: "https://gulfnews.com/rss", language: "en" },
    { name: "Khaleej Times", url: "https://www.khaleejtimes.com/rss", language: "en" },
    { name: "The National", url: "https://www.thenationalnews.com/rss", language: "en" },
  ],
  SA: [
    { name: "Arab News", url: "https://www.arabnews.com/rss.xml", language: "en" },
    { name: "Saudi Gazette", url: "https://saudigazette.com.sa/feed/", language: "en" },
  ],
  EG: [
    { name: "Egypt Today", url: "https://www.egypttoday.com/RSS", language: "en" },
    { name: "Al-Ahram", url: "https://english.ahram.org.eg/RSS/", language: "en" },
  ],
  ZA: [
    { name: "News24", url: "https://www.news24.com/rss", language: "en" },
    { name: "Mail & Guardian", url: "https://mg.co.za/feed/", language: "en" },
    { name: "Daily Maverick", url: "https://www.dailymaverick.co.za/feed/", language: "en" },
  ],
  NG: [
    { name: "Punch Nigeria", url: "https://punchng.com/feed/", language: "en" },
    { name: "The Guardian Nigeria", url: "https://guardian.ng/feed/", language: "en" },
    { name: "Vanguard", url: "https://www.vanguardngr.com/feed/", language: "en" },
  ],
  KR: [
    { name: "Korea Herald", url: "http://www.koreaherald.com/rss", language: "en" },
    { name: "Yonhap News", url: "https://en.yna.co.kr/RSS/news.xml", language: "en" },
    { name: "Korea Times", url: "https://www.koreatimes.co.kr/www/rss/rss.xml", language: "en" },
  ],
  SG: [
    { name: "Straits Times", url: "https://www.straitstimes.com/news/singapore/rss.xml", language: "en" },
    { name: "Channel NewsAsia", url: "https://www.channelnewsasia.com/rssfeeds/8395986", language: "en" },
    { name: "Today Online", url: "https://www.todayonline.com/feed", language: "en" },
  ],
  MY: [
    { name: "The Star", url: "https://www.thestar.com.my/rss/News/", language: "en" },
    { name: "New Straits Times", url: "https://www.nst.com.my/rss", language: "en" },
    { name: "Malay Mail", url: "https://www.malaymail.com/feed/rss/malaysia", language: "en" },
  ],
  TH: [
    { name: "Bangkok Post", url: "https://www.bangkokpost.com/rss/data/topstories.xml", language: "en" },
    { name: "The Nation", url: "https://www.nationthailand.com/rss", language: "en" },
  ],
  ID: [
    { name: "Jakarta Post", url: "https://www.thejakartapost.com/feed/", language: "en" },
    { name: "Kompas", url: "https://www.kompas.com/rss", language: "id" },
    { name: "Tempo", url: "https://rss.tempo.co/", language: "id" },
  ],
  PH: [
    { name: "Philippine Daily Inquirer", url: "https://newsinfo.inquirer.net/feed", language: "en" },
    { name: "ABS-CBN News", url: "https://news.abs-cbn.com/rss", language: "en" },
    { name: "Rappler", url: "https://www.rappler.com/feed/", language: "en" },
  ],
  VN: [
    { name: "VnExpress", url: "https://vnexpress.net/rss/tin-moi-nhat.rss", language: "vi" },
    { name: "Vietnam News", url: "https://vietnamnews.vn/rss/", language: "en" },
  ],
  PK: [
    { name: "Dawn", url: "https://www.dawn.com/feeds/home", language: "en" },
    { name: "Geo News", url: "https://www.geo.tv/rss/", language: "en" },
    { name: "The News International", url: "https://www.thenews.com.pk/rss/1/1", language: "en" },
  ],
  BD: [
    { name: "Daily Star", url: "https://www.thedailystar.net/rss.xml", language: "en" },
    { name: "Prothom Alo", url: "https://www.prothomalo.com/feed/", language: "bn" },
    { name: "Dhaka Tribune", url: "https://www.dhakatribune.com/feed/", language: "en" },
  ],
  NL: [
    { name: "NOS", url: "https://feeds.nos.nl/nosnieuwsalgemeen", language: "nl" },
    { name: "De Volkskrant", url: "https://www.volkskrant.nl/voorpagina/rss.xml", language: "nl" },
    { name: "NRC", url: "https://www.nrc.nl/rss/", language: "nl" },
  ],
  ES: [
    { name: "El País", url: "https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada", language: "es" },
    { name: "El Mundo", url: "https://e00-elmundo.uecdn.es/elmundo/rss/portada.xml", language: "es" },
    { name: "La Vanguardia", url: "https://www.lavanguardia.com/rss/home.xml", language: "es" },
  ],
  IT: [
    { name: "La Repubblica", url: "https://www.repubblica.it/rss/homepage/rss2.0.xml", language: "it" },
    { name: "Corriere della Sera", url: "https://xml2.corriereobjects.it/rss/homepage.xml", language: "it" },
    { name: "ANSA", url: "https://www.ansa.it/sito/ansait_rss.xml", language: "it" },
  ],
  MX: [
    { name: "El Universal", url: "https://www.eluniversal.com.mx/rss.xml", language: "es" },
    { name: "Milenio", url: "https://www.milenio.com/rss", language: "es" },
    { name: "Reforma", url: "https://www.reforma.com/rss/portada.xml", language: "es" },
  ],
  TR: [
    { name: "Daily Sabah", url: "https://www.dailysabah.com/rssFeed/turkey", language: "en" },
    { name: "Hurriyet Daily News", url: "https://www.hurriyetdailynews.com/rss", language: "en" },
    { name: "TRT World", url: "https://www.trtworld.com/rss", language: "en" },
  ],
  PL: [
    { name: "Gazeta Wyborcza", url: "https://wyborcza.pl/rss/", language: "pl" },
    { name: "TVN24", url: "https://tvn24.pl/najnowsze.xml", language: "pl" },
  ],
  UA: [
    { name: "Kyiv Independent", url: "https://kyivindependent.com/feed/", language: "en" },
    { name: "Ukrayinska Pravda", url: "https://www.pravda.com.ua/rss/", language: "uk" },
  ],
};

// Get language name from code
export function getLanguageName(code: string): { name: string; nativeName: string } {
  const allLanguages = Object.values(COUNTRY_LANGUAGES).flat();
  const lang = allLanguages.find(l => l.code === code);
  return lang ? { name: lang.name, nativeName: lang.nativeName } : { name: code.toUpperCase(), nativeName: code.toUpperCase() };
}

// Get country languages
export function getCountryLanguages(countryCode: string): CountryLanguage[] {
  return COUNTRY_LANGUAGES[countryCode.toUpperCase()] || [{ code: "en", name: "English", nativeName: "English" }];
}

// Get local RSS feeds for a country
export function getCountryLocalRSS(countryCode: string) {
  return COUNTRY_LOCAL_RSS[countryCode.toUpperCase()] || [];
}

// Determine if news is local or global based on source
export function isLocalNews(sourceUrl: string, countryCode: string): boolean {
  const localFeeds = getCountryLocalRSS(countryCode);
  return localFeeds.some(feed => sourceUrl.toLowerCase().includes(new URL(feed.url).hostname.replace('www.', '')));
}
