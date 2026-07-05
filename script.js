const resumeInput = document.getElementById('resumeInput');
const charCount = document.getElementById('charCount');
const scanLine = document.getElementById('scanLine');
const analyzeBtn = document.getElementById('analyzeBtn');
const roleTarget = document.getElementById('roleTarget');

const outputEmpty = document.getElementById('outputEmpty');
const outputLoading = document.getElementById('outputLoading');
const outputResult = document.getElementById('outputResult');
const outputError = document.getElementById('outputError');
const errorText = document.getElementById('errorText');
const loadingText = document.getElementById('loadingText');

const scoreNumber = document.getElementById('scoreNumber');
const ringFg = document.getElementById('ringFg');
const scoreVerdict = document.getElementById('scoreVerdict');
const sectionsContainer = document.getElementById('sectionsContainer');
const quickfixList = document.getElementById('quickfixList');

resumeInput.addEventListener('input', () => {
  charCount.textContent = `${resumeInput.value.length} characters`;
});

const loadingMessages = [
  'Reading document…',
  'Checking section structure…',
  'Cross-checking against target role…',
  'Scoring keyword coverage…',
  'Compiling scorecard…'
];

function showState(state) {
  outputEmpty.classList.add('hidden');
  outputLoading.classList.add('hidden');
  outputResult.classList.add('hidden');
  outputError.classList.add('hidden');
  if (state === 'empty') outputEmpty.classList.remove('hidden');
  if (state === 'loading') outputLoading.classList.remove('hidden');
  if (state === 'result') outputResult.classList.remove('hidden');
  if (state === 'error') outputError.classList.remove('hidden');
}

let loadingInterval;

function startLoadingMessages() {
  let i = 0;
  loadingText.textContent = loadingMessages[0];
  loadingInterval = setInterval(() => {
    i = (i + 1) % loadingMessages.length;
    loadingText.textContent = loadingMessages[i];
  }, 1400);
}

function stopLoadingMessages() {
  clearInterval(loadingInterval);
}

function renderResult(data) {
  const score = Math.max(0, Math.min(100, Number(data.score) || 0));
  const circumference = 327;
  const offset = circumference - (score / 100) * circumference;

  scoreNumber.textContent = score;
  ringFg.style.strokeDashoffset = offset;

  let color = '#5EEAD4';
  let verdict = 'Strong match';
  if (score < 50) { color = '#FF6B6B'; verdict = 'Needs work'; }
  else if (score < 75) { color = '#FFB84D'; verdict = 'Room to improve'; }

  ringFg.style.stroke = color;
  scoreVerdict.textContent = verdict;
  scoreVerdict.style.color = color;

  sectionsContainer.innerHTML = '';
  (data.sections || []).forEach(sec => {
    const div = document.createElement('div');
    div.className = 'section-item';
    const tagClass = sec.status === 'strong' ? 'tag-strong' : sec.status === 'weak' ? 'tag-weak' : 'tag-ok';
    div.innerHTML = `
      <div class="section-item-head">
        <span class="section-name">${escapeHtml(sec.name)}</span>
        <span class="section-tag ${tagClass}">${escapeHtml(sec.status)}</span>
      </div>
      <p class="section-note">${escapeHtml(sec.note)}</p>
    `;
    sectionsContainer.appendChild(div);
  });

  quickfixList.innerHTML = '';
  (data.quickFixes || []).forEach(fix => {
    const li = document.createElement('li');
    li.textContent = fix;
    quickfixList.appendChild(li);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

analyzeBtn.addEventListener('click', async () => {
  const text = resumeInput.value.trim();
  if (text.length < 50) {
    showState('error');
    errorText.textContent = 'Paste a bit more of your resume — at least a few lines of real content — so the scan has something to work with.';
    return;
  }

  analyzeBtn.disabled = true;
  scanLine.classList.add('active');
  showState('loading');
  startLoadingMessages();

  try {
    const response = await fetch('/.netlify/functions/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeText: text, targetRole: roleTarget.value })
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const data = await response.json();
    renderResult(data);
    showState('result');
  } catch (err) {
    showState('error');
    errorText.textContent = 'Scan failed — the analysis function might not be deployed yet, or the Groq API key is missing. Check the README for setup steps.';
    console.error(err);
  } finally {
    analyzeBtn.disabled = false;
    scanLine.classList.remove('active');
    stopLoadingMessages();
  }
});
