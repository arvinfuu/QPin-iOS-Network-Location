export type Lang = "en" | "zh-CN" | "zh-TW" | "ja" | "es";

export const LANGS: { code: Lang; label: string }[] = [
  { code: "en", label: "English" },
  { code: "zh-CN", label: "简体中文" },
  { code: "zh-TW", label: "繁體中文" },
  { code: "ja", label: "日本語" },
  { code: "es", label: "Español" },
];

export type MessageKey =
  | "title"
  | "seoTitle"
  | "selectLocation"
  | "saveToDevice"
  | "favorite"
  | "myLocation"
  | "favorites"
  | "clearAll"
  | "activeLocation"
  | "refresh"
  | "clearRestore"
  | "pasteLink"
  | "parse"
  | "searchPlace"
  | "search"
  | "hintSave"
  | "moduleMissing"
  | "moduleMissingBody"
  | "guide"
  | "diagnostics"
  | "iosCacheNote"
  | "iosCacheBody"
  | "hardwareCta"
  | "hardwareCtaBody"
  | "hardwareLink"
  | "disclaimer"
  | "lon"
  | "lat"
  | "accuracy"
  | "manualCoords"
  | "apply"
  | "noFavorites"
  | "activeNow"
  | "passthrough"
  | "saved"
  | "cleared"
  | "parseOk"
  | "parseFail"
  | "searchFail"
  | "needProxy"
  | "favNamePlaceholder"
  | "cancel"
  | "confirm"
  | "linkHint"
  | "diagTitle"
  | "runDiag"
  | "mitmOnly"
  | "notGps"
  | "privacyNote";

type Dict = Record<MessageKey, string>;

const en: Dict = {
  title: "QPin Network Location",
  seoTitle: "Free iOS Network Location Changer | QPin",
  selectLocation: "Target location",
  saveToDevice: "Save to device",
  favorite: "Favorite",
  myLocation: "My location",
  favorites: "Favorites",
  clearAll: "Clear all",
  activeLocation: "Active on device",
  refresh: "Refresh",
  clearRestore: "Clear & restore real network location",
  pasteLink: "Paste map link",
  parse: "Parse",
  searchPlace: "Search place",
  search: "Search",
  hintSave: "Pick a point, then Save to device. Coordinates stay in your proxy app only.",
  moduleMissing: "Module not active",
  moduleMissingBody:
    "Check: 1) module installed & enabled 2) MITM on with trusted cert 3) hostnames gs-loc.apple.com & gs-loc-cn.apple.com 4) traffic goes through proxy",
  guide: "Install guide",
  diagnostics: "Diagnostics",
  iosCacheNote: "iOS location cache",
  iosCacheBody:
    "On newer iOS versions, locationd may cache network results. After changing coordinates, reboot may be required. This tool does not modify GPS hardware.",
  hardwareCta: "Need more reliable outdoor spoofing?",
  hardwareCtaBody:
    "Network location can be overridden by strong GPS outdoors, and requires a trusted MITM certificate. QPin Hardware is a separate product for different scenarios.",
  hardwareLink: "View QPin Hardware",
  disclaimer:
    "Modifies Apple Wi‑Fi/cell network location only — not GPS. Apps may ignore results. No guarantee of safety, anti-ban, or all iOS versions.",
  lon: "Longitude",
  lat: "Latitude",
  accuracy: "Accuracy (m)",
  manualCoords: "Manual coordinates",
  apply: "Apply",
  noFavorites: "No favorites yet",
  activeNow: "Active",
  passthrough: "Passthrough (real network location)",
  saved: "Saved to device",
  cleared: "Cleared — passthrough mode",
  parseOk: "Coordinates parsed",
  parseFail: "Could not parse link",
  searchFail: "Search failed",
  needProxy: "Save requires proxy + module (Safari must use the proxy)",
  favNamePlaceholder: "Name (e.g. Home, Office)",
  cancel: "Cancel",
  confirm: "Save",
  linkHint: "Apple Maps · Google · Amap · Baidu · lat,lon text",
  diagTitle: "Module & MITM check",
  runDiag: "Run diagnostic",
  mitmOnly: "MITM only gs-loc.apple.com and gs-loc-cn.apple.com",
  notGps: "This is not GPS spoofing",
  privacyNote: "Favorites stay in browser localStorage. Active coords never upload to QPin servers.",
};

const zhCN: Dict = {
  ...en,
  title: "QPin iOS 网络定位修改器",
  seoTitle: "Free iOS Network Location Changer | QPin",
  selectLocation: "目标位置",
  saveToDevice: "储存到设备",
  favorite: "收藏位置",
  myLocation: "当前位置",
  favorites: "收藏列表",
  clearAll: "清空全部",
  activeLocation: "当前生效坐标",
  refresh: "刷新",
  clearRestore: "清除并恢复真实网络定位",
  pasteLink: "粘贴地图链接",
  parse: "解析",
  searchPlace: "搜索地点",
  search: "搜索",
  hintSave: "选好位置后点「储存到设备」。坐标只保存在代理工具本地，不会上传。",
  moduleMissing: "模块未生效",
  moduleMissingBody:
    "请检查：1）已安装并启用模块 2）MITM 已开启且信任证书 3）主机名含 gs-loc.apple.com / gs-loc-cn.apple.com 4）流量已走代理",
  guide: "安装教程",
  diagnostics: "诊断",
  iosCacheNote: "iOS 定位缓存提醒",
  iosCacheBody:
    "较新 iOS 上 locationd 可能缓存网络定位结果。修改坐标后可能需要重启设备。本工具不修改 GPS 硬件信号。",
  hardwareCta: "需要更稳定的户外场景？",
  hardwareCtaBody:
    "户外 GPS 较强时会覆盖网络定位；且需要信任 MITM 证书。QPin Hardware 是面向不同场景的独立产品。",
  hardwareLink: "了解 QPin Hardware",
  disclaimer:
    "仅修改 Apple Wi‑Fi/基站网络定位，不是 GPS。不保证所有 App 采用结果，不宣传绝对安全、防封或全版本支持。",
  lon: "经度",
  lat: "纬度",
  accuracy: "精度（米）",
  manualCoords: "手动输入经纬度",
  apply: "应用",
  noFavorites: "暂无收藏",
  activeNow: "当前生效",
  passthrough: "透传（真实网络定位）",
  saved: "已储存到设备",
  cleared: "已清除 — 透传模式",
  parseOk: "已解析坐标",
  parseFail: "无法解析链接",
  searchFail: "搜索失败",
  needProxy: "储存需要开启代理并启用模块（Safari 需走代理）",
  favNamePlaceholder: "备注名称（如：家、公司）",
  cancel: "取消",
  confirm: "保存",
  linkHint: "支持 Apple Maps · Google · 高德 · 百度 · 经纬度文本",
  diagTitle: "模块与 MITM 诊断",
  runDiag: "运行诊断",
  mitmOnly: "MITM 仅限 gs-loc.apple.com 与 gs-loc-cn.apple.com",
  notGps: "这不是 GPS 模拟",
  privacyNote: "收藏保存在浏览器 localStorage。生效坐标不会上传到 QPin 后端。",
};

const zhTW: Dict = {
  ...zhCN,
  title: "QPin iOS 網路定位修改器",
  selectLocation: "目標位置",
  saveToDevice: "儲存到裝置",
  favorite: "收藏位置",
  myLocation: "目前位置",
  favorites: "收藏列表",
  clearAll: "清空全部",
  activeLocation: "目前生效座標",
  refresh: "重新整理",
  clearRestore: "清除並恢復真實網路定位",
  pasteLink: "貼上地圖連結",
  parse: "解析",
  searchPlace: "搜尋地點",
  search: "搜尋",
  hintSave: "選好位置後點「儲存到裝置」。座標只保存在代理工具本機，不會上傳。",
  moduleMissing: "模組未生效",
  moduleMissingBody:
    "請檢查：1）已安裝並啟用模組 2）MITM 已開啟且信任憑證 3）主機名含 gs-loc.apple.com / gs-loc-cn.apple.com 4）流量已走代理",
  guide: "安裝教學",
  diagnostics: "診斷",
  iosCacheNote: "iOS 定位快取提醒",
  iosCacheBody:
    "較新 iOS 上 locationd 可能快取網路定位結果。修改座標後可能需要重新開機。本工具不修改 GPS 硬體訊號。",
  hardwareCta: "需要更穩定的戶外場景？",
  hardwareCtaBody:
    "戶外 GPS 較強時會覆蓋網路定位；且需要信任 MITM 憑證。QPin Hardware 是面向不同場景的獨立產品。",
  hardwareLink: "了解 QPin Hardware",
  disclaimer:
    "僅修改 Apple Wi‑Fi/基地台網路定位，不是 GPS。不保證所有 App 採用結果，不宣傳絕對安全、防封或全版本支援。",
  lon: "經度",
  lat: "緯度",
  accuracy: "精度（公尺）",
  manualCoords: "手動輸入經緯度",
  apply: "套用",
  noFavorites: "尚無收藏",
  activeNow: "目前生效",
  passthrough: "透傳（真實網路定位）",
  saved: "已儲存到裝置",
  cleared: "已清除 — 透傳模式",
  parseOk: "已解析座標",
  parseFail: "無法解析連結",
  searchFail: "搜尋失敗",
  needProxy: "儲存需要開啟代理並啟用模組（Safari 需走代理）",
  favNamePlaceholder: "備註名稱（如：家、公司）",
  cancel: "取消",
  confirm: "儲存",
  linkHint: "支援 Apple Maps · Google · 高德 · 百度 · 經緯度文字",
  diagTitle: "模組與 MITM 診斷",
  runDiag: "執行診斷",
  mitmOnly: "MITM 僅限 gs-loc.apple.com 與 gs-loc-cn.apple.com",
  notGps: "這不是 GPS 模擬",
  privacyNote: "收藏保存在瀏覽器 localStorage。生效座標不會上傳到 QPin 後端。",
};

const ja: Dict = {
  ...en,
  title: "QPin iOS ネットワーク位置変更",
  selectLocation: "目標位置",
  saveToDevice: "端末に保存",
  favorite: "お気に入り",
  myLocation: "現在地",
  favorites: "お気に入り一覧",
  clearAll: "すべて削除",
  activeLocation: "端末の有効座標",
  refresh: "更新",
  clearRestore: "クリアして実ネットワーク位置に戻す",
  pasteLink: "地図リンクを貼付け",
  parse: "解析",
  searchPlace: "場所を検索",
  search: "検索",
  hintSave: "地点を選び「端末に保存」。座標はプロキシアプリ内のみに保存されます。",
  moduleMissing: "モジュールが無効",
  moduleMissingBody:
    "確認: 1) モジュール有効 2) MITM と信頼済み証明書 3) gs-loc.apple.com / gs-loc-cn.apple.com 4) トラフィックがプロキシ経由",
  guide: "インストールガイド",
  diagnostics: "診断",
  iosCacheNote: "iOS 位置キャッシュ",
  iosCacheBody:
    "新しい iOS では locationd がネットワーク位置をキャッシュする場合があります。座標変更後は再起動が必要なことがあります。GPS ハードウェアは変更しません。",
  hardwareCta: "屋外でより安定した方式が必要ですか？",
  hardwareCtaBody:
    "屋外の強い GPS はネットワーク位置を上書きします。MITM 証明書の信頼も必要です。QPin Hardware は別製品です。",
  hardwareLink: "QPin Hardware を見る",
  disclaimer:
    "Apple の Wi‑Fi/基地局ネットワーク位置のみ変更します（GPS ではありません）。すべての App が採用する保証はありません。",
  lon: "経度",
  lat: "緯度",
  accuracy: "精度 (m)",
  manualCoords: "座標を手動入力",
  apply: "適用",
  noFavorites: "お気に入りなし",
  activeNow: "有効",
  passthrough: "パススルー（実ネットワーク位置）",
  saved: "端末に保存しました",
  cleared: "クリア済み — パススルー",
  parseOk: "座標を解析しました",
  parseFail: "リンクを解析できません",
  searchFail: "検索に失敗",
  needProxy: "保存にはプロキシとモジュールが必要です",
  favNamePlaceholder: "名前（例: 自宅、会社）",
  cancel: "キャンセル",
  confirm: "保存",
  linkHint: "Apple Maps · Google · Amap · Baidu · 緯度経度テキスト",
  diagTitle: "モジュール & MITM 診断",
  runDiag: "診断を実行",
  mitmOnly: "MITM は gs-loc.apple.com と gs-loc-cn.apple.com のみ",
  notGps: "GPS スプーフィングではありません",
  privacyNote: "お気に入りはブラウザ localStorage のみ。有効座標は QPin に送信されません。",
};

const es: Dict = {
  ...en,
  title: "QPin Cambiador de ubicación de red iOS",
  selectLocation: "Ubicación objetivo",
  saveToDevice: "Guardar en el dispositivo",
  favorite: "Favorito",
  myLocation: "Mi ubicación",
  favorites: "Favoritos",
  clearAll: "Borrar todos",
  activeLocation: "Activo en el dispositivo",
  refresh: "Actualizar",
  clearRestore: "Borrar y restaurar ubicación de red real",
  pasteLink: "Pegar enlace de mapa",
  parse: "Analizar",
  searchPlace: "Buscar lugar",
  search: "Buscar",
  hintSave:
    "Elige un punto y guarda. Las coordenadas solo quedan en tu app de proxy.",
  moduleMissing: "Módulo inactivo",
  moduleMissingBody:
    "Revisa: 1) módulo instalado y activo 2) MITM con certificado de confianza 3) hosts gs-loc.apple.com y gs-loc-cn.apple.com 4) tráfico por el proxy",
  guide: "Guía de instalación",
  diagnostics: "Diagnóstico",
  iosCacheNote: "Caché de ubicación iOS",
  iosCacheBody:
    "En iOS recientes, locationd puede cachear resultados de red. Tras cambiar coordenadas puede hacer falta reiniciar. No modifica el GPS.",
  hardwareCta: "¿Necesitas spoofing exterior más estable?",
  hardwareCtaBody:
    "El GPS fuerte al aire libre puede anular la ubicación de red; además requiere confiar en un certificado MITM. QPin Hardware es otro producto.",
  hardwareLink: "Ver QPin Hardware",
  disclaimer:
    "Solo modifica la ubicación de red Wi‑Fi/celular de Apple, no el GPS. Las apps pueden ignorarlo. Sin promesas de seguridad total ni anti-ban.",
  lon: "Longitud",
  lat: "Latitud",
  accuracy: "Precisión (m)",
  manualCoords: "Coordenadas manuales",
  apply: "Aplicar",
  noFavorites: "Sin favoritos",
  activeNow: "Activo",
  passthrough: "Passthrough (ubicación de red real)",
  saved: "Guardado en el dispositivo",
  cleared: "Borrado — modo passthrough",
  parseOk: "Coordenadas analizadas",
  parseFail: "No se pudo analizar el enlace",
  searchFail: "Búsqueda fallida",
  needProxy: "Guardar requiere proxy + módulo",
  favNamePlaceholder: "Nombre (p. ej. Casa, Oficina)",
  cancel: "Cancelar",
  confirm: "Guardar",
  linkHint: "Apple Maps · Google · Amap · Baidu · texto lat,lon",
  diagTitle: "Diagnóstico de módulo y MITM",
  runDiag: "Ejecutar diagnóstico",
  mitmOnly: "MITM solo gs-loc.apple.com y gs-loc-cn.apple.com",
  notGps: "Esto no es spoofing de GPS",
  privacyNote:
    "Favoritos en localStorage del navegador. Las coordenadas activas no se suben a QPin.",
};

const ALL: Record<Lang, Dict> = {
  en,
  "zh-CN": zhCN,
  "zh-TW": zhTW,
  ja,
  es,
};

export function detectLang(acceptLanguage?: string, search?: string): Lang {
  if (search) {
    const m = search.match(/[?&]lang=([a-zA-Z-]+)/);
    if (m) {
      const c = m[1]!;
      if (c === "zh" || c === "zh-cn" || c === "zh-Hans") return "zh-CN";
      if (c === "zh-tw" || c === "zh-Hant" || c === "zh-HK") return "zh-TW";
      if (c in ALL) return c as Lang;
    }
  }
  const al = (acceptLanguage || "").toLowerCase();
  if (al.includes("zh-tw") || al.includes("zh-hk") || al.includes("zh-hant")) return "zh-TW";
  if (al.includes("zh")) return "zh-CN";
  if (al.includes("ja")) return "ja";
  if (al.includes("es")) return "es";
  return "en";
}

export function t(lang: Lang, key: MessageKey): string {
  return ALL[lang]?.[key] ?? ALL.en[key] ?? key;
}

export function messagesJson(lang: Lang): string {
  return JSON.stringify(ALL[lang] || ALL.en);
}

export function hardwarePath(lang: Lang): string {
  const map: Record<Lang, string> = {
    en: "en",
    "zh-CN": "zh-CN",
    "zh-TW": "zh-TW",
    ja: "ja",
    es: "es",
  };
  return `/${map[lang]}/products/hardware`;
}
