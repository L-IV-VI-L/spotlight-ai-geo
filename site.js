const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const locationParams = new URL(location.href).searchParams;
const currentPage = location.pathname.split('/').pop() || 'index.html';
let language = 'en';
let activeMarket = 'us';
let enquiryContext = '';

// A single navigation at every width; the mobile menu is a disclosure, not a modal.
const siteHeader = document.querySelector('.site-header');
const primaryNavigation = document.getElementById('primary-navigation');
const menuToggle = document.querySelector('.menu-toggle');
const mobileNavigation = window.matchMedia('(max-width: 1080px)');
let navigationHadFocus = false;
function closeNavigation(returnFocus = false) {
  siteHeader.classList.remove('nav-open');
  menuToggle.setAttribute('aria-expanded', 'false');
  navigationHadFocus = false;
  if (returnFocus) menuToggle.focus({ preventScroll: true });
}
menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  siteHeader.classList.toggle('nav-open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
  languageSwitch.open = false;
  if (open) primaryNavigation.querySelector('[aria-current], a').focus({ preventScroll: true });
});
siteHeader.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
    event.preventDefault();
    closeNavigation(true);
  }
});
siteHeader.addEventListener('focusout', event => {
  if (event.relatedTarget && !siteHeader.contains(event.relatedTarget)) closeNavigation();
});
document.addEventListener('pointerdown', event => {
  if (!siteHeader.contains(event.target)) closeNavigation();
});
primaryNavigation.addEventListener('click', event => {
  if (event.target.closest('a')) closeNavigation();
});
primaryNavigation.addEventListener('focusin', () => { navigationHadFocus = true; });
primaryNavigation.addEventListener('focusout', event => {
  if (event.relatedTarget && !primaryNavigation.contains(event.relatedTarget)) navigationHadFocus = false;
});
mobileNavigation.addEventListener('change', () => {
  const focusHidden = !mobileNavigation.matches && document.activeElement === menuToggle;
  // CSS can hide the focused link before the media-query event arrives.
  const focusInMenu = mobileNavigation.matches && (navigationHadFocus || primaryNavigation.contains(document.activeElement));
  closeNavigation();
  if (focusInMenu) menuToggle.focus({ preventScroll: true });
  if (focusHidden) primaryNavigation.querySelector('[aria-current], a').focus({ preventScroll: true });
});
new ResizeObserver(() => {
  document.documentElement.style.setProperty('--site-header-height', siteHeader.offsetHeight + 'px');
}).observe(siteHeader);

// Repeat the platform strip before registering translations.
const engineScroll = document.getElementById('engine-scroll');
if (engineScroll) {
  const repeat = engineScroll.firstElementChild.cloneNode(true);
  repeat.setAttribute('aria-hidden', 'true');
  engineScroll.append(repeat);
  const motion = window.matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  const sync = () => {
    engineScroll.classList.toggle('is-marquee', motion.matches);
    repeat.hidden = !motion.matches;
  };
  sync();
  motion.addEventListener('change', sync);
}

const textTranslations = Array.from(document.querySelectorAll('[data-zh]'), element => ({ element, en: element.textContent, zh: element.dataset.zh }));
const attributeTranslations = [
  ['aria-label', 'data-zh-label'], ['placeholder', 'data-zh-placeholder'], ['content', 'data-zh-content'],
].flatMap(([name, attr]) => Array.from(document.querySelectorAll(`[${attr}]`), element => ({ element, name, en: element.getAttribute(name), zh: element.getAttribute(attr) })));
const words = {
  en: { website: 'Please enter a valid website address.', ready: 'Your brief is ready. Send it using the email button below.', copied: 'Brief copied.', selected: 'Brief selected. Use your keyboard or menu to copy.', count: n => `${n} project${n === 1 ? '' : 's'}`, context: 'Related to: ', heading: 'Spotlight AI GEO · AUDIT ENQUIRY', brand: 'Brand', site: 'Website', market: 'Target market', email: 'Reply email', goal: 'Goal', source: 'Page / project', defaultGoal: 'Understand our brand visibility and prioritize the next improvements.', subject: 'GEO audit enquiry' },
  zh: { website: '请输入有效的官网地址，例如 example.com。', ready: '需求已整理，可通过下方邮件按钮发送给团队。', copied: '简报已复制。', selected: '已选中简报，可使用快捷键或菜单复制。', count: n => `${n} 个项目`, context: '相关内容：', heading: '聚光AI · 品牌诊断需求', brand: '公司或品牌', site: '官网地址', market: '目标市场', email: '联系邮箱', goal: '希望改善', source: '来源页面／项目', defaultGoal: '了解品牌在 AI 搜索中的表现，并确定下一步优化重点。', subject: '聚光AI 品牌诊断需求' },
};
const languageSwitch = document.querySelector('.language-switch');
const languageOptions = Array.from(languageSwitch.querySelectorAll('button'));
const languageTrigger = languageSwitch.querySelector('summary');
const currentLanguage = languageSwitch.querySelector('[data-current-language]');
const languageKey = 'signal-atlas-language';

function updateLocalLinks() {
  for (const link of document.links) {
    const raw = link.getAttribute('href');
    if (!raw || !/^[\w-]+\.html(?:[?#]|$)/.test(raw)) continue;
    const url = new URL(raw, location.href);
    url.searchParams.set('lang', language);
    link.setAttribute('href', url.pathname.split('/').pop() + url.search + url.hash);
  }
}

function contextLabel() {
  if (language !== 'zh') return enquiryContext;
  return enquiryContext.replace(/^Case: /, '客户案例：').replace(/^Market: /, '目标市场：')
    .replace('Navigation', '导航咨询').replace('Homepage hero', '首页')
    .replace('Case library', '客户案例库').replace('Platform walkthrough', '系统讲解')
    .replace('Sample report', '交付报告样例').replace('GEO services', 'GEO 服务')
    .replace('Platform', 'GEO 系统').replace('Markets', '市场方案').replace('About', '关于聚光')
    .replace('No matching case', '行业项目咨询').replace('Website', '官网咨询');
}

function setLanguage(next) {
  language = next;
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  for (const row of textTranslations) row.element.textContent = row[language];
  for (const row of attributeTranslations) row.element.setAttribute(row.name, row[language]);
  for (const option of languageOptions) option.setAttribute('aria-pressed', String(option.value === language));
  const selected = languageOptions.find(option => option.value === language);
  currentLanguage.textContent = selected.textContent;
  currentLanguage.lang = selected.lang;
  updateLocalLinks();
  updateCaseReturnLinks();
  website.setCustomValidity('');
  renderContext();
  if (!briefOutput.hidden) renderBrief();
  filterCases(false);
}

function closeLanguageMenu() {
  languageSwitch.open = false;
  languageTrigger.focus({ preventScroll: true });
}
for (const option of languageOptions) {
  option.addEventListener('click', () => {
    setLanguage(option.value);
    try { localStorage.setItem(languageKey, language); } catch {}
    const url = new URL(location.href);
    url.searchParams.set('lang', language);
    history.replaceState(null, '', url);
    closeLanguageMenu();
  });
}
languageSwitch.addEventListener('keydown', event => {
  if (event.key === 'Escape') { event.preventDefault(); closeLanguageMenu(); return; }
  if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
  event.preventDefault();
  languageSwitch.open = true;
  const index = languageOptions.indexOf(event.target);
  const next = index === -1 ? (event.key === 'ArrowDown' ? 0 : languageOptions.length - 1) : (index + (event.key === 'ArrowDown' ? 1 : -1) + languageOptions.length) % languageOptions.length;
  languageOptions[next].focus();
});
languageSwitch.addEventListener('focusout', event => {
  if (!languageSwitch.contains(event.relatedTarget)) languageSwitch.open = false;
});
languageSwitch.addEventListener('toggle', () => {
  if (languageSwitch.open) closeNavigation();
});
document.addEventListener('pointerdown', event => {
  if (!languageSwitch.contains(event.target)) languageSwitch.open = false;
});

// The hero and existing educational audit use independent, labelled views.
for (const group of document.querySelectorAll('.audit-tabs')) {
  const buttons = Array.from(group.querySelectorAll('[data-view]'));
  for (const button of buttons) button.addEventListener('click', () => {
    for (const item of buttons) {
      const selected = item === button;
      item.setAttribute('aria-pressed', String(selected));
      document.getElementById(item.dataset.view).hidden = !selected;
    }
  });
}

const platformTabs = Array.from(document.querySelectorAll('[data-platform-tab]'));
function selectPlatform(index, updateUrl = true) {
  if (!platformTabs[index]) return;
  for (const [i, item] of platformTabs.entries()) {
    const selected = i === index;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
    document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
  }
  if (updateUrl && currentPage === 'platform.html') {
    const url = new URL(location.href);
    url.searchParams.delete('feature');
    url.hash = platformTabs[index].id;
    history.replaceState(null, '', url);
  }
}
for (const [index, tab] of platformTabs.entries()) {
  tab.addEventListener('click', () => selectPlatform(index));
  tab.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? platformTabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + platformTabs.length) % platformTabs.length;
    selectPlatform(next);
    platformTabs[next].focus();
  });
}
function platformFromLocation() {
  const index = platformTabs.findIndex(tab => '#' + tab.id === location.hash);
  return index >= 0 ? index : Number(new URL(location.href).searchParams.get('feature') || 0);
}
selectPlatform(platformFromLocation(), false);

const marketButtons = Array.from(document.querySelectorAll('.market-buttons [data-market]'));
function selectMarket(key, updateUrl = true) {
  if (!marketButtons.some(item => item.dataset.market === key)) return;
  activeMarket = key;
  for (const item of marketButtons) {
    const selected = item.dataset.market === key;
    item.setAttribute('aria-pressed', String(selected));
    document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
  }
  if (updateUrl && currentPage === 'markets.html') {
    const url = new URL(location.href);
    url.searchParams.delete('market');
    url.hash = 'market-panel-' + key;
    history.replaceState(null, '', url);
  }
}
for (const button of marketButtons) button.addEventListener('click', () => selectMarket(button.dataset.market));
function marketFromLocation() {
  return location.hash.startsWith('#market-panel-') ? location.hash.slice(14) : new URL(location.href).searchParams.get('market') || 'us';
}
selectMarket(marketFromLocation(), false);
// Accept old shared links, then keep homepage interactions out of its URL.
if (platformTabs.length || marketButtons.length) {
  const url = new URL(location.href);
  if (currentPage === 'platform.html' && locationParams.has('feature') && !url.hash) {
    url.hash = platformTabs.find(tab => tab.getAttribute('aria-selected') === 'true').id;
  }
  if (currentPage === 'markets.html' && locationParams.has('market') && !url.hash) url.hash = 'market-panel-' + activeMarket;
  url.searchParams.delete('feature');
  url.searchParams.delete('market');
  history.replaceState(null, '', url);
}

const caseLibrary = document.getElementById('case-library');
const caseSearch = document.getElementById('case-search');
const caseCards = caseLibrary ? Array.from(caseLibrary.querySelectorAll('.case-card')) : [];
const seaKeys = new Set(['sea', 'sg', 'ph', 'my', 'id', 'vn', 'th']);
function filterCases(updateUrl = true) {
  if (!caseLibrary) return;
  const query = caseSearch.value.trim().toLocaleLowerCase();
  let count = 0;
  for (const card of caseCards) {
    const visible = !query || card.dataset.search.toLocaleLowerCase().includes(query);
    card.hidden = !visible;
    if (visible) count++;
  }
  document.getElementById('case-count').textContent = words[language].count(count);
  document.getElementById('case-empty').hidden = count > 0;
  if (updateUrl) {
    const url = new URL(location.href);
    url.searchParams.delete('industry');
    url.searchParams.delete('market');
    if (query) url.searchParams.set('q', caseSearch.value.trim()); else url.searchParams.delete('q');
    history.replaceState(null, '', url);
  }
}
function restoreFilters() {
  if (!caseLibrary) return;
  const params = new URL(location.href).searchParams;
  caseSearch.value = params.get('q') || '';
  filterCases();
}
if (caseLibrary) {
  restoreFilters();
  caseSearch.addEventListener('input', () => {
    const url = new URL(location.href);
    url.hash = '';
    history.replaceState(null, '', url);
    filterCases();
  });
}

// Carry the list position through a project and related projects without hijacking Back.
let caseReturnUrl = null;
const caseReturnKey = 'juguang-case-return:';
try {
  const referrer = document.referrer ? new URL(document.referrer) : null;
  if (referrer?.origin === location.origin && /^(cases|case-[\w-]+)\.html$/.test(referrer.pathname.split('/').pop())) {
    const saved = sessionStorage.getItem(caseReturnKey + currentPage);
    if (saved) {
      const url = new URL(saved, location.href);
      if (url.origin === location.origin && url.pathname === new URL('cases.html', location.href).pathname) caseReturnUrl = url;
    }
  }
} catch {}
function updateCaseReturnLinks() {
  const url = new URL(caseReturnUrl || 'cases.html', location.href);
  url.searchParams.set('lang', language);
  for (const link of document.querySelectorAll('[data-case-return]')) {
    link.href = 'cases.html' + url.search + url.hash;
  }
}
function rememberCaseReturn(event) {
  const link = event.target.closest('a[href]');
  if (!link) return;
  const target = new URL(link.href, location.href);
  if (target.origin !== location.origin || !/^case-[\w-]+\.html$/.test(target.pathname.split('/').pop())) return;
  let returnUrl = caseReturnUrl;
  if (caseLibrary) {
    returnUrl = new URL('cases.html', location.href);
    returnUrl.searchParams.set('lang', language);
    if (caseSearch.value.trim()) returnUrl.searchParams.set('q', caseSearch.value.trim());
    const card = link.closest('.case-card');
    if (card) returnUrl.hash = card.id;
  }
  try {
    const key = caseReturnKey + target.pathname.split('/').pop();
    if (returnUrl) sessionStorage.setItem(key, returnUrl.href);
    else sessionStorage.removeItem(key);
  } catch {}
}
document.addEventListener('pointerdown', rememberCaseReturn);
document.addEventListener('click', rememberCaseReturn);

const auditDialog = document.getElementById('audit-dialog');
const briefForm = document.getElementById('brief-form');
const briefBrand = document.getElementById('brief-brand');
const website = document.getElementById('website');
const briefMarket = document.getElementById('brief-market');
const briefEmail = document.getElementById('brief-email');
const briefGoal = document.getElementById('brief-goal');
const briefOutput = document.getElementById('brief-output');
const briefText = document.getElementById('brief-text');
const briefStatus = document.getElementById('brief-status');
const briefContext = document.getElementById('brief-context');
let normalizedWebsite = '';
let auditOpener = null;
function renderContext() {
  briefContext.hidden = !enquiryContext;
  briefContext.textContent = words[language].context + contextLabel();
}
function renderBrief() {
  const labels = words[language];
  const sep = language === 'zh' ? '：' : ': ';
  briefText.value = [labels.heading, '', labels.brand + sep + briefBrand.value.trim(), labels.site + sep + normalizedWebsite,
    labels.market + sep + briefMarket.selectedOptions[0].textContent, labels.email + sep + briefEmail.value.trim(),
    labels.goal + sep + (briefGoal.value.trim() || labels.defaultGoal), labels.source + sep + contextLabel()].join('\n');
  const subject = labels.subject + ' · ' + briefBrand.value.trim();
  document.getElementById('email-brief').href = 'mailto:hello@hashmeta.ai?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(briefText.value);
  briefStatus.textContent = labels.ready;
}
for (const button of document.querySelectorAll('[data-open-audit]')) {
  button.addEventListener('click', () => {
    auditOpener = button;
    closeNavigation();
    enquiryContext = button.dataset.source || 'Website';
    let market = button.dataset.market || (marketButtons.length ? activeMarket : '');
    if (seaKeys.has(market)) market = 'sea';
    if (market && Array.from(briefMarket.options).some(option => option.value === market)) briefMarket.value = market;
    briefOutput.hidden = true;
    briefStatus.textContent = '';
    renderContext();
    auditDialog.showModal();
    document.body.classList.add('modal-open');
    briefBrand.focus();
  });
}
document.getElementById('close-audit').addEventListener('click', () => auditDialog.close());
auditDialog.addEventListener('close', () => {
  if (mobileNavigation.matches && primaryNavigation.contains(auditOpener)) menuToggle.focus({ preventScroll: true });
});
briefForm.addEventListener('input', () => {
  website.setCustomValidity('');
  briefOutput.hidden = true;
  briefStatus.textContent = '';
});
briefForm.addEventListener('submit', event => {
  event.preventDefault();
  const raw = website.value.trim();
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : 'https://' + raw);
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname.includes('.') || url.username || url.password || /\s/.test(raw)) throw new Error('Invalid site');
    normalizedWebsite = url.href;
    website.setCustomValidity('');
  } catch {
    website.setCustomValidity(words[language].website);
    website.reportValidity();
    return;
  }
  renderBrief();
  briefOutput.hidden = false;
  briefText.focus({ preventScroll: true });
  briefOutput.scrollIntoView({ block: 'nearest', behavior: reducedMotion.matches ? 'instant' : 'smooth' });
});
document.getElementById('copy-brief').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(briefText.value); briefStatus.textContent = words[language].copied; }
  catch { briefText.focus(); briefText.select(); briefStatus.textContent = words[language].selected; }
});
document.getElementById('download-brief').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob(['\ufeff' + briefText.value], { type: 'text/plain;charset=utf-8' }));
  const download = document.createElement('a');
  download.href = url;
  download.download = 'spotlight-ai-geo-brief.txt';
  download.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

const imageDialog = document.getElementById('image-dialog');
const expandedImage = document.getElementById('expanded-image');
for (const button of document.querySelectorAll('[data-zoom]')) {
  button.addEventListener('click', () => {
    const caption = language === 'zh' ? button.dataset.captionZh : button.dataset.caption;
    document.getElementById('image-caption').textContent = caption;
    expandedImage.src = button.dataset.zoom;
    expandedImage.alt = caption;
    imageDialog.showModal();
    document.body.classList.add('modal-open');
    document.getElementById('close-image').focus();
  });
}
document.getElementById('close-image').addEventListener('click', () => imageDialog.close());
for (const dialog of [auditDialog, imageDialog]) {
  dialog.addEventListener('close', () => document.body.classList.remove('modal-open'));
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
}
for (const button of document.querySelectorAll('[data-print]')) button.addEventListener('click', () => window.print());
function restorePageLocation() {
  selectMarket(marketFromLocation(), false);
  selectPlatform(platformFromLocation(), false);
  restoreFilters();
}
function revealLinkedFeature() {
  if (currentPage === 'platform.html' && platformTabs.some(tab => '#' + tab.id === location.hash)) {
    document.querySelector('.platform-shell').scrollIntoView({ block: 'start', behavior: 'instant' });
  }
}
window.addEventListener('popstate', restorePageLocation);
window.addEventListener('hashchange', () => { restorePageLocation(); revealLinkedFeature(); });
window.addEventListener('pageshow', () => closeNavigation());
window.addEventListener('load', revealLinkedFeature);
let savedLanguage;
try { savedLanguage = localStorage.getItem(languageKey); } catch {}
const requestedLanguage = locationParams.get('lang');
setLanguage((['en', 'zh'].includes(requestedLanguage) ? requestedLanguage : savedLanguage) === 'zh' ? 'zh' : 'en');


const heroVideo = document.querySelector('[data-hero-video]');
const homeHero = heroVideo?.closest('.home-hero');
const homeHeader = document.querySelector('.home-page .site-header');
if (homeHero && homeHeader) {
  const sizeHeroBackdrop = () => {
    homeHero.style.setProperty('--hero-header-height', `${homeHeader.offsetHeight}px`);
  };
  sizeHeroBackdrop();
  if ('ResizeObserver' in window) new ResizeObserver(sizeHeroBackdrop).observe(homeHeader);
}

if (homeHero && 'IntersectionObserver' in window) {
  const desktopMotion = window.matchMedia('(min-width: 731px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  let heroInView = false;
  let sourcesLoaded = false;
  let wantsPlayback = false;

  function playBufferedVideo() {
    if (!wantsPlayback || !heroVideo.paused || heroVideo.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) return;
    heroVideo.play().catch(() => {
      if (heroVideo.paused) heroVideo.classList.remove('is-playing');
    });
  }

  function syncHeroVideo() {
    const shouldPlay = heroInView && desktopMotion.matches && !document.hidden;
    if (shouldPlay === wantsPlayback) return;
    wantsPlayback = shouldPlay;

    if (!shouldPlay) {
      heroVideo.pause();
      heroVideo.classList.remove('is-playing');
      return;
    }

    if (!sourcesLoaded) {
      for (const source of heroVideo.querySelectorAll('[data-src]')) {
        source.src = source.dataset.src;
      }
      sourcesLoaded = true;
      heroVideo.preload = 'auto';
      heroVideo.load();
    }

    playBufferedVideo();
  }

  heroVideo.addEventListener('canplaythrough', playBufferedVideo);
  heroVideo.addEventListener('playing', () => {
    heroVideo.classList.toggle('is-playing', wantsPlayback && !heroVideo.paused);
  });
  heroVideo.addEventListener('pause', () => {
    if (heroVideo.paused) heroVideo.classList.remove('is-playing');
  });
  heroVideo.addEventListener('error', () => heroVideo.classList.remove('is-playing'));
  desktopMotion.addEventListener('change', syncHeroVideo);
  document.addEventListener('visibilitychange', syncHeroVideo);

  const heroVisibility = new IntersectionObserver(([entry]) => {
    heroInView = entry.isIntersecting;
    syncHeroVideo();
  });
  heroVisibility.observe(homeHero);
}

if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const revealOnEntry = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) entry.target.classList.add('is-revealed');
    }
  }, { rootMargin: '-16px 0px' });

  // Reset beyond the viewport so the reveal transform cannot retrigger entry at its edge.
  const resetOnExit = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) entry.target.classList.remove('is-revealed');
    }
  }, { rootMargin: '24px 0px' });

  document.documentElement.classList.add('reveal-enabled');
  for (const element of document.querySelectorAll('[data-reveal]')) {
    revealOnEntry.observe(element);
    resetOnExit.observe(element);
  }

  document.addEventListener('focusin', (event) => {
    if (event.target.matches(':focus-visible')) {
      event.target.closest('[data-reveal]')?.classList.add('is-revealed');
    }
  });
}
