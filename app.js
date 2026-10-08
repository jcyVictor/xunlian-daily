(function () {
  'use strict';
  const C=window.TrainingCore, main=document.querySelector('#main');
  let state=C.defaults(), storageOK=true, currentDay=C.dateKey(), toastTimeout, preview='A';
  try { const raw=localStorage.getItem(C.KEY); if(raw) {const original=JSON.parse(raw); state=C.validateBackup(original); state.timerEnd=Number(original.timerEnd)||0;} } catch(e) { storageOK=false; }
  function save() {try{localStorage.setItem(C.KEY,JSON.stringify(state));storageOK=true;}catch(e){storageOK=false;}document.querySelector('#storage-warning').hidden=storageOK;}
  function record() { return state.days[currentDay] ||= {}; }
  function esc(x) { return String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function notify(message) { const el=document.querySelector('#toast');el.textContent=message;el.hidden=false;clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>el.hidden=true,3500); }
  function tab() {return ['today','train','food','history','plan'].includes(location.hash.slice(1))?location.hash.slice(1):'today';}
  function dateLabel(day) {return C.parseDay(day).toLocaleDateString('zh-CN',{month:'long',day:'numeric',weekday:'long'});}
  function heading(label,title,desc='') {return `<div class="page-heading"><div class="eyebrow">${label}</div><h1>${title}</h1>${desc?`<p>${desc}</p>`:''}</div>`;}
  function options(values,selected) {return values.map(([v,t])=>`<option value="${v}" ${v===selected?'selected':''}>${t}</option>`).join('');}
  function checkinForm() {
    const c=record().checkin||C.checkinDefault();
    return `<form id="checkin-form" class="card form-stack">
      <div><h3>训练前，问问身体</h3><p>每天确认一次。今天仍只吃了麦片的话，选择“吃得很少”。</p></div>
      <label>今天进食情况<select name="food" required>${options([['unknown','请选择'],['ok','已正常进食，胃部舒适'],['low','没吃饭 / 只吃一点麦片等']],c.food)}</select></label>
      <label>肌肉酸痛程度<select name="sore" required>${options([['unknown','请选择'],['none','没有酸痛'],['mild','轻微酸胀，活动完全正常'],['moderate','明显酸痛，伸展或日常活动受影响']],c.sore)}</select></label>
      <label>睡眠和精神状态<select name="energy" required>${options([['unknown','请选择'],['ok','精神尚可，可以正常活动'],['poor','很疲劳 / 睡眠严重不足']],c.energy)}</select></label>
      <label>距上次力量训练是否不足 48 小时？<select name="recent" required>${options([['unknown','请选择'],['no','已满 48 小时 / 近期没练'],['yes','还不足 48 小时']],c.recent)}</select></label>
      <label>是否有刺痛、明显肿胀、异常无力或头晕？<select name="red" required>${options([['unknown','请选择'],['no','没有'],['yes','有其中一种']],c.red)}</select></label>
      <button class="primary wide" type="submit">更新今天的建议 <span aria-hidden="true">↗</span></button>
      <p class="tiny">肌肉酸胀和关节刺痛不是一回事。症状持续或加重时，请先就医评估；严重肌肉痛伴茶色尿需及时急诊。</p>
    </form>`;
  }
  function week() {return `<div class="week">${C.weekDates(currentDay).map((d,i)=>{const p=C.plan(state,d),complete=state.days[d]?.workout?.completedAt;let label=complete?'已完成':p.label;if(d===currentDay&&!complete){if(p.mode==='recover')label='恢复';if(p.mode==='stop')label='暂停';if(p.mode==='check')label='待确认';}return `<div class="day ${d===currentDay?'current':''} ${p.kind==='train'?'gym':''}"><small>${['一','二','三','四','五','六','日'][i]}</small><strong>${C.parseDay(d).getDate()}</strong><span>${label}</span></div>`;}).join('')}</div>`;}
  function habits() {const h=record().habits||{};return [['breakfast','吃好早餐','主食 + 鸡蛋 / 奶 / 豆制品'],['lunch','正常吃午饭','米饭 + 肉 / 豆腐 + 蔬菜'],['dinner','正常吃晚饭','不因休息日而跳过正餐'],['protein','检查全天蛋白质','目标约 '+state.settings.protein+' g，食物优先'],['sleep','给睡眠留时间','今晚尽量睡 7.5–9 小时']].map(([id,title,sub])=>`<label class="check-line"><input type="checkbox" data-habit="${id}" ${h[id]?'checked':''}><span>${title}<small>${sub}</small></span></label>`).join('');}
  function todayView() {
    const p=C.plan(state,currentDay), r=record();
    const completed=C.weekDates(currentDay).filter(d=>state.days[d]?.workout?.completedAt).length;
    const action=(p.mode==='train'||p.mode==='cardio')?'<a class="primary" href="#train">查看今日安排 <span aria-hidden="true">↗</span></a>':p.mode==='done'?'<a class="primary" href="#history">查看本次记录 ↗</a>':'<a class="primary" href="#checkin" id="checkin-link">确认身体状态 ↗</a>';
    main.innerHTML=`<div class="date-line">${dateLabel(currentDay)}</div>
      <section class="hero"><div class="eyebrow">ONE DAY AT A TIME</div><span class="hero-badge">${p.mode==='train'?'今日力量训练':p.mode==='done'?'今日已完成':'先照顾好身体'}</span><div class="hero-orbit" aria-hidden="true"></div><h1>${p.title}</h1><p>${p.reason}</p>${action}</section>
      <div class="stats"><div class="stat"><strong>${completed}<small>本周力量完成 / 3 次</small></strong></div><div class="stat"><strong>每天<small>都有安排 · 强度轮换</small></strong></div><div class="stat"><strong>${state.settings.protein}<small>蛋白质参考 · g / 天</small></strong></div></div>
      <div class="section-head"><h2>本周节奏</h2><a href="#plan" class="tiny">调整训练日 ↗</a></div>${week()}
      <div class="section-head" id="checkin"><h2>今日状态</h2><span>动作随恢复调整</span></div>${checkinForm()}
      ${['recover','rest'].includes(p.mode)?`<div class="card"><h3>恢复日也有安排</h3><p>先正常吃饭。没有不适时轻松走路 15–30 分钟，按口渴喝水；手臂明显酸痛时暂缓网球，不反复拉扯痛处。</p><button type="button" class="secondary wide" data-action="recovered" style="margin-top:15px">${r.recovered?'✓ 已记录今天的恢复':'记录：今天按恢复安排'}</button></div>`:''}
      <div class="section-head"><h2>今天的小目标</h2><span>吃饭和休息一样重要</span></div><div class="card">${habits()}</div>
      <div class="notice">每天都有内容，但力量训练只安排肩胸、腿、背三天；其余日子做低强度有氧、网球、活动度或主动恢复。计划会根据你填写的状态暂停不合适的训练。</div>`;
  }
  function workoutRecord(type) {const r=record(); if(!r.workout) r.workout={type,sets:{},warmup:false,startedAt:new Date().toISOString(),completedAt:null}; return r.workout;}
  function setDefaults(w,id) {return w.sets[id] ||= [{weight:'',reps:'',done:false},{weight:'',reps:'',done:false}];}
  function lastResult(id) {const entries=Object.entries(state.days).filter(([d,r])=>d<currentDay&&r.workout?.completedAt&&r.workout.sets?.[id]?.some(s=>s.done)).sort(([a],[b])=>b.localeCompare(a));if(!entries.length)return '第一次先用轻重量试做';const [d,r]=entries[0],rows=r.workout.sets[id].filter(s=>s.done);return `上次 ${d.slice(5)}：${rows.map(s=>`${s.weight===''?'未记重量':s.weight+' kg'} × ${s.reps||'—'}`).join(' / ')}`;}
  function exerciseCard(ex,i,w,active) {
    const sets=w?setDefaults(w,ex.id):[{weight:'',reps:'',done:false},{weight:'',reps:'',done:false}];
    return `<article class="card exercise"><div class="exercise-top"><div class="exercise-index">${String(i+1).padStart(2,'0')} / ${ex.optional?'可选辅助':'主要动作'}</div><div class="row-between"><h3>${ex.name}</h3><span class="pill">2 组 × ${ex.reps} 次</span></div><p>${ex.area}</p><p class="tiny">${esc(lastResult(ex.id))}</p></div><details><summary>怎么调器械、怎么做</summary><p>${ex.tip}</p><p>用力呼气，回放吸气。重量以做完仍能再做 3–4 次为准。不要追求力竭或酸痛。</p></details>
      ${active?`<div class="sets"><div class="set-head"><span>组</span><span>重量 kg</span><span>实际次数</span><span>完成</span></div>${sets.map((s,n)=>`<div class="set-row"><span class="set-number">${n+1}</span><input type="number" min="0" max="500" step="0.5" inputmode="decimal" placeholder="轻重量" aria-label="${ex.name}第${n+1}组重量" data-set="${ex.id}" data-row="${n}" data-field="weight" value="${esc(s.weight)}"><input type="number" min="1" max="100" step="1" inputmode="numeric" placeholder="${ex.reps}" aria-label="${ex.name}第${n+1}组次数" data-set="${ex.id}" data-row="${n}" data-field="reps" value="${esc(s.reps)}"><label class="set-check"><input type="checkbox" aria-label="${ex.name}第${n+1}组完成" data-set="${ex.id}" data-row="${n}" data-field="done" ${s.done?'checked':''}></label></div>`).join('')}</div><div class="exercise-bottom"><small>先完成热身，再开始正式组</small><button type="button" class="text-button" data-rest="${ex.rest}">休息 ${ex.rest} 秒 ◷</button></div>`:''}</article>`;
  }
  function progress(w) {const rows=Object.values(w?.sets||{}).flat();return rows.filter(s=>s.done).length;}
  function trainView() {
    const p=C.plan(state,currentDay), w=record().workout, active=p.mode==='train', type=active?(w?.type||p.type):preview;
    if(p.mode==='cardio') { main.innerHTML=heading('TODAY\'S FLOW',p.title,'每天都有安排，但今天让心肺和恢复接管主角。')+`<div class="card"><h3>${p.label}</h3><p>${p.reason}</p><div class="notice">建议：轻松坡走、椭圆机或单车 25–35 分钟；周六可改为网球 45–60 分钟。能说完整短句即可，不追求大汗淋漓。</div><ul><li>先热身 5 分钟，最后放慢 5 分钟。</li><li>腿部酸痛时缩短到 15–20 分钟，或只散步。</li><li>手臂明显酸痛时先暂停网球和拉扯动作。</li></ul><button class="secondary wide" data-action="recovered">记录：今天完成有氧 / 恢复</button></div><div class="notice">力量训练后不需要每天额外有氧；本周低强度有氧已有安排。</div>`; return; }
    if(p.mode==='rest') { main.innerHTML=heading('RECOVERY DAY','今天主动恢复','每天都有内容，今天的内容是把身体养回来。')+`<div class="card"><h3>完全休息或轻松走路</h3><p>${p.reason}</p><ul><li>轻松走路 15–30 分钟，可做舒适范围内的活动度练习。</li><li>正常吃饭、补水，今晚尽量睡 7.5–9 小时。</li><li>不需要为了“每天去”而加练。</li></ul><button class="secondary wide" data-action="recovered">记录：今天完成恢复</button></div>`; return; }
    main.innerHTML=heading('YOUR SESSION',active?'今天练 '+type:'器械训练指南','固定器械为主 · 约 35–45 分钟 · 先练稳，再加重')+
      (!active?`<div class="notice ${p.mode==='stop'?'danger':''}">${p.reason} ${p.mode==='done'?'':'下方仅预览动作，不安排今天打卡。'}</div><div class="segmented"><button class="secondary ${type==='A'?'selected':''}" data-preview="A">肩胸维持</button><button class="secondary ${type==='B'?'selected':''}" data-preview="B">腿部</button><button class="secondary ${type==='C'?'selected':''}" data-preview="C">背部</button></div>`:'')+
      (active?`<div class="card"><h3>先用 8–10 分钟准备</h3><p>慢走或单车 5 分钟；今天的第一个器械用很轻重量试做约 8–10 次。第一次请工作人员调好座椅和安全装置。</p><label class="check-line"><input id="warmup" type="checkbox" ${w?.warmup?'checked':''}><span>热身完成，动作没有引起疼痛</span></label><div class="progress-track"><div id="session-progress" style="width:${progress(w)*10}%"></div></div><p id="session-count" class="tiny">${progress(w)} / 10 组已记录 · 初次每个动作 1 组也可以</p></div>`:'<div class="notice">主要动作组间休息 90–120 秒，呼吸没恢复可以更久。时间紧就省略最后一个辅助动作。固定器械也要调好座椅，不会用先问工作人员。</div>')+
      C.exercises(type).map((ex,i)=>exerciseCard(ex,i,w,active)).join('')+
      (active?`<div class="card"><h3>今天练到这里</h3><p>不必凑满 10 组。只记录实际做过的组；动作不舒服时停止。保存后今天不再安排一轮。</p><button class="primary wide" style="margin-top:15px" data-action="finish">保存本次训练</button></div>`:'')+
      '<div class="notice">连续两次达到次数上限、动作稳定且仍有 2–3 次余力，再考虑增加最小一档。机器没有同样的重量标准，不与别人比较。</div>';
  }
  function foodView() {
    main.innerHTML=heading('EAT & RECOVER','吃够，才练得好','食堂也能执行。每天选好三餐，不用把每样都吃一遍。')+
      `<div class="card"><div class="row-between"><h3>每日参考</h3><span class="pill">可在计划页调整</span></div><div class="stats"><div class="stat"><strong>${state.settings.calories}<small>千卡 / 天</small></strong></div><div class="stat"><strong>${state.settings.protein}<small>蛋白质 g / 天</small></strong></div><div class="stat"><strong>3<small>顿正常正餐</small></strong></div><p>热量是起点估算，不是精确处方。结合两周平均体重、饥饿感和训练表现再调整。休息日也要正常吃饭。</p></div>
      <div class="card"><div class="meal-title"><span>01 / 早</span><h3>早餐二选一</h3></div><p>燕麦干重 60–80 g + 牛奶 250–300 ml + 鸡蛋 2 个 + 一份水果。</p><p>或大肉包 1 个 / 小肉包 2 个 + 鸡蛋 2 个 + 无糖奶或豆浆 300 ml。</p><details><summary>麦片、坚果怎么选</summary><p>原味燕麦按包装泡软或煮熟。“没膨胀”不能判断是不是即食。坚果约 10–15 g 可作为加餐，计入总热量，不是蛋白质主力。</p></details></div>
      <div class="card"><div class="meal-title"><span>02 / 午</span><h3>食堂搭配</h3></div><p>熟米饭约 200–300 g，按饥饿和全天摄入调整；去皮鸡腿 + 适量非油炸肉或豆腐；蔬菜约 200–300 g。</p><p>一个小鸡腿可能不够一餐的蛋白质。肉类看去骨后的量，选约 1–2 掌心。少打油汁，蔬菜不只数朵数。</p></div>
      <div class="card"><div class="meal-title"><span>03 / 晚</span><h3>正常吃，不补偿性挨饿</h3></div><p>主食 + 鱼、瘦肉、蛋或豆制品 + 两拳左右蔬菜。按当天情况补足蛋白质；不要把一天的量都挤到晚上。</p></div>
      <div class="card"><h3>训练前后</h3><p>正餐后通常留 1–2 小时，大餐或油腻餐留更久；少量香蕉、面包后通常留 30–60 分钟，以胃部舒适为准。训练后正常吃饭，没有必须立刻喝蛋白粉的倒计时。</p><p>没吃早饭、午饭又只有少量麦片时，先补饭；不要用咖啡或补剂硬撑。</p></div>
      <div class="section-head"><h2>补剂按需要选</h2><span>都不是减脂必需品</span></div>
      <div class="card"><h3>肌酸一水合物 · 可选</h3><p>开始规律力量训练后，可每天 3–5 g，休息日也吃。不需要冲击期。短期体重可能因肌肉储水上升；有肾病或肾功能异常先问医生。</p></div>
      <div class="card"><h3>蛋白粉 · 补缺口</h3><p>建议准备一桶作为“来不及吃饭”的备用，不需要强行每天喝。每天目标约 150–185g；一上午没吃东西时，可用 1 勺乳清（通常 20–30g 蛋白质）＋牛奶，再配香蕉或面包，之后仍要正常吃午饭。</p><p>看标签里的蛋白质克数，一勺粉不等于一勺纯蛋白；食物吃够就不用喝。乳糖不耐受可选分离乳清。</p></div>
      <div class="card"><h3>鱼油 · 先看吃鱼情况</h3><p>优先每周吃约 2 次鱼，其中包含富含脂肪的鱼。很少吃鱼时可考虑补充，常见补充量为 EPA+DHA 合计约 500–1000 mg / 天；它不直接减脂，健康人也不必普遍服用。</p><p>鱼油 1000 mg 不等于 EPA+DHA 1000 mg，按营养表核算份量。正在用抗凝药、有出血问题或近期手术时先咨询医生。</p></div>
      <div class="card"><h3>维生素 · 有需要再补</h3><p>饮食多样时通常不必额外吃复合维生素。维生素 D 根据日晒、摄入和缺乏风险决定；健康成年人不用因为健身就常规筛查或大剂量补充。</p></div>
      <div class="notice">运动中少量多次喝水。长时间运动、天气热且出汗多时考虑含钠电解质。无需购买燃脂补剂、减肥茶或 BCAA。</div>`;
  }
  function historyView() {
    const weights=Object.entries(state.weights).sort(([a],[b])=>a.localeCompare(b));
    const recent=weights.filter(([d])=>d<=currentDay&&d>=C.addDays(currentDay,-6));
    const avg=recent.length?(recent.reduce((n,[,w])=>n+w,0)/recent.length).toFixed(1):'—';
    const logs=Object.entries(state.days).filter(([,r])=>r.workout?.completedAt||r.recovered).sort(([a],[b])=>b.localeCompare(a));
    const displayWeights=weights.slice(-7), min=Math.min(...displayWeights.map(([,w])=>w));
    main.innerHTML=heading('YOUR PROGRESS','每一点，都算数','记录真实完成的训练。漏一天不会清零，也不用加倍补课。')+
      `<div class="card"><div class="row-between"><h3>晨起体重</h3><span class="pill">最近 7 天均值 ${avg} kg</span></div><p class="tiny">起床上厕所后、进食前测量。当前窗口有 ${recent.length} 次记录，单日波动不代表脂肪变化。</p><form id="weight-form" class="grid2" style="margin-top:15px"><label>日期<input type="date" name="day" required value="${currentDay}" max="${currentDay}"></label><label>体重 kg<input type="number" name="weight" min="30" max="250" step="0.1" inputmode="decimal" required value="${state.weights[currentDay]||''}" placeholder="填实际体重"></label><button type="submit" class="primary">保存体重</button></form>${displayWeights.length?`<div class="weight-chart" aria-label="最近体重记录">${displayWeights.map(([d,w])=>`<div class="weight-column" style="height:${30+Math.min((w-min)*12,45)}%" title="${d}：${w} kg"><span>${w}</span></div>`).join('')}</div><p class="tiny">${displayWeights[0][0].slice(5)} → ${displayWeights.at(-1)[0].slice(5)} · 图形仅作趋势参考</p>`:''}</div>
      <div class="section-head"><h2>训练与恢复</h2><span>${logs.filter(([,r])=>r.workout?.completedAt).length} 次力量训练</span></div><div class="card">${logs.length?logs.slice(0,30).map(([d,r])=>`<div class="record"><div class="row-between"><h3>${r.workout?.completedAt?'器械训练 '+r.workout.type:'恢复日'}</h3><span class="tiny muted">${d}</span></div>${r.workout?.completedAt?`<p>完成 ${progress(r.workout)} 组 · ${new Date(r.workout.completedAt).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}</p><details><summary>查看动作记录</summary>${C.exercises(r.workout.type).filter(ex=>r.workout.sets[ex.id]?.some(s=>s.done)).map(ex=>`<p>${ex.name}：${r.workout.sets[ex.id].filter(s=>s.done).map(s=>`${s.weight===''?'未记重量':s.weight+' kg'} × ${s.reps||'未记次数'}`).join('；')}</p>`).join('')}</details>`:'<p>按身体状态休息和调整。</p>'}</div>`).join(''):'<div class="empty">还没有训练记录。<br>先从今天的状态检查开始。</div>'}</div>
      <div class="card"><h3>保存一份备份</h3><p>记录只存在这个浏览器和设备中，清理浏览器、更换网址或手机后不会自动跟随。建议每周导出一次，保存到 iPhone“文件”。</p><div class="button-row"><button class="secondary" data-action="export">导出备份</button><button class="secondary" data-action="import">恢复备份</button></div><input id="import-file" type="file" accept="application/json,.json" hidden><details><summary>导出后没有出现文件？</summary><p>部分浏览器会直接显示 JSON 文本，可用分享按钮存到“文件”。也可以打开下方文本复制保存。</p><button class="text-button" data-action="backup-text">显示备份文本</button><textarea id="backup-text" class="backup-area" readonly hidden aria-label="备份文本"></textarea></details></div>`;
  }
  function planView() {
    const s=state.settings;
    const schedule=[['10:20–10:30','下课 → 宿舍'],['10:30–10:35','拿包、换衣服'],['10:35–10:55','宿舍 → 校门 → 健身房'],['10:55–11:40','45 分钟训练，包含热身和休息'],['11:40–12:05','整理、返回学校'],['12:05–12:30','买饭、正常吃午饭'],['12:30–12:40','淋浴、换衣服'],['12:40–13:40','1 小时卧床午休'],['13:40–13:55','起床、出门、抵达教室']];
    const daily=[['周一','肩胸维持','器械推胸、器械肩推、侧平举机、绳索下压'],['周二','低强度有氧','坡走 / 单车 25–35 分钟＋活动度'],['周三','腿部','腿举、腿屈伸、腿弯举、提踵、核心'],['周四','有氧＋活动度','轻松有氧 25–35 分钟，不追求力竭'],['周五','背部','高位下拉、胸托划船、反向飞鸟，二头少量'],['周六','网球 / 轻有氧','网球 45–60 分钟或轻松单车；疲劳就散步'],['周日','主动恢复','轻松走路、活动度和睡眠']];
    main.innerHTML=heading('MAKE IT YOURS','每天都有安排','3 天固定器械力量＋3 天低强度活动＋1 天主动恢复。到健身房不等于每天练到累。')+
      `<form id="settings-form" class="card form-stack"><h3>当前模式：每日到场</h3><p>力量训练只安排肩胸、腿、背三天，保护二头、肩、膝和下背的恢复。你仍然可以每天去健身房完成当天的低强度内容。</p><label>计划开始日期<input type="date" name="start" value="${s.start}" required></label><div class="grid2"><label>每日热量参考 kcal<input type="number" name="calories" min="1500" max="4000" step="50" value="${s.calories}" required></label><label>每日蛋白质参考 g<input type="number" name="protein" min="80" max="220" step="1" value="${s.protein}" required></label></div><p class="tiny">默认数值只作起点，实际需要结合两周平均体重、饥饿感和训练表现调整。</p><button class="primary wide" type="submit">保存计划</button></form>
      <div class="section-head"><h2>7 天循环</h2><span>每天有内容</span></div><div class="card">${daily.map(([day,title,desc])=>`<div class="record"><div class="row-between"><h3>${day} · ${title}</h3><span class="pill">${title.includes('器械')?'力量':'恢复 / 有氧'}</span></div><p>${desc}</p></div>`).join('')}</div>
      <div class="section-head"><h2>中午训练时间表</h2><span>14:00 上课</span></div><div class="card"><ol class="timeline">${schedule.map(([time,action])=>`<li><time>${time}</time><span>${action}</span></li>`).join('')}</ol><p>假设食堂顺路、排队短。1 小时卧床不保证睡满 1 小时。遇到排队就减少辅助动作，或把训练移到课少的下午；不要挤掉午饭。</p></div>
      <div class="card"><h3>力量训练后还要有氧吗？</h3><p>不需要每次都加。程序已经把低强度有氧放在独立日；力量日如果时间充足，可在结束后加 10–20 分钟坡走或单车，腿部训练后控制在 10–15 分钟。网球和跑步也算有氧。</p></div>
      <div class="card"><img class="install-icon" src="icon.svg" alt="循练图标"><h3>添加到 iPhone 主屏幕</h3><p>用 Safari 打开网址 → 分享 → 添加到主屏幕 → 添加。不同 iOS 版本分享按钮位置可能不同。</p><p id="install-state" class="tiny">${location.protocol==='https:'?'当前使用 HTTPS。首次完整加载后，支持离线打开。':location.hostname==='localhost'||location.hostname==='127.0.0.1'?'当前是电脑本地预览。iPhone 需要访问电脑的局域网网址，或上线后的 HTTPS 网址。':'当前为局域网或文件预览。主屏幕入口和离线功能取决于浏览器；长期使用建议部署到 HTTPS 网址。'}</p></div>
      <div class="notice">不需要注册，无广告或分析脚本。状态检查和训练记录保存在设备本地，不会上传到服务器。网页按内置规则生成每日安排；聊天中的后续修改不会自动同步。</div>`;
  }
  function render() {currentDay=C.dateKey();document.querySelector('#storage-warning').hidden=storageOK;const t=tab();document.querySelectorAll('[data-tab]').forEach(a=>{a.classList.toggle('active',a.dataset.tab===t);a.setAttribute('aria-current',a.dataset.tab===t?'page':'false');});({today:todayView,train:trainView,food:foodView,history:historyView,plan:planView})[t]();}
  function ensureToday() {if(currentDay!==C.dateKey()){currentDay=C.dateKey();render();notify('日期已更新，请重新确认今天的状态。');return false;}return true;}
  function startTimer(seconds) {state.timerEnd=Date.now()+seconds*1000;save();tickTimer();}
  function tickTimer() {const el=document.querySelector('#timer');if(!state.timerEnd){el.hidden=true;document.body.classList.remove('timer-on');return;}const left=Math.max(0,Math.ceil((state.timerEnd-Date.now())/1000));el.hidden=false;document.body.classList.add('timer-on');document.querySelector('#timer-left').textContent=left?`${String(Math.floor(left/60)).padStart(2,'0')}:${String(left%60).padStart(2,'0')}`:'休息结束';if(left===0){state.timerEnd=0;save();notify('休息时间到；呼吸没恢复可以再休息。');}}
  main.addEventListener('submit',e=>{
    e.preventDefault();if(!ensureToday())return;const f=e.target,fd=new FormData(f);
    if(f.id==='checkin-form'){const c=Object.fromEntries(fd.entries());if(Object.values(c).includes('unknown')){notify('请先完成全部状态检查。');return;}record().checkin=c;save();render();window.scrollTo({top:0,behavior:'smooth'});notify('已更新今天的建议。');}
    if(f.id==='weight-form'){const d=fd.get('day'),w=Number(fd.get('weight'));if(!C.validDay(d)||d>currentDay||!Number.isFinite(w)||w<30||w>250){notify('请检查日期和体重。');return;}state.weights[d]=w;save();render();notify('体重已保存。');}
    if(f.id==='settings-form'){const start=fd.get('start'),calories=Number(fd.get('calories')),protein=Number(fd.get('protein'));if(!C.validDay(start)||calories<1500||calories>4000||protein<80||protein>220){notify('请检查计划设置。');return;}state.settings={mode:'daily',days:[1,3,5],start,calories,protein};save();render();notify('每日到场计划已保存。');}
  });
  main.addEventListener('change',async e=>{
    if(!ensureToday())return;const el=e.target;
    if(el.dataset.habit){(record().habits||={})[el.dataset.habit]=el.checked;save();}
    if(el.id==='warmup'){workoutRecord(C.plan(state,currentDay).type).warmup=el.checked;save();}
    if(el.dataset.set){const p=C.plan(state,currentDay);if(p.mode!=='train')return;const w=workoutRecord(p.type),s=setDefaults(w,el.dataset.set)[Number(el.dataset.row)],field=el.dataset.field;
      if(field==='done'){if(!w.warmup){el.checked=false;notify('先完成热身，再记录正式组。');return;}if(el.checked&&(!s.reps||s.reps<1)){el.checked=false;notify('先填这一组实际完成的次数。');return;}s.done=el.checked;if(s.done)startTimer(C.exercises(w.type).find(x=>x.id===el.dataset.set).rest);}
      else {if(!el.validity.valid){notify('请填写有效的重量或次数。');el.value=s[field];return;}if(field==='reps'&&s.done&&el.value===''){el.value=s.reps;notify('已完成的组需要保留实际次数。');return;}s[field]=el.value===''?'':Number(el.value);}
      save();const n=progress(w);document.querySelector('#session-progress').style.width=n*10+'%';document.querySelector('#session-count').textContent=`${n} / 10 组已记录 · 初次每个动作 1 组也可以`;
    }
    if(el.id==='import-file'&&el.files[0]){const file=el.files[0];try{if(file.size>5e6)throw Error('文件过大，请选择应用导出的 JSON 备份。');const next=C.validateBackup(JSON.parse(await file.text()));if(!confirm('恢复备份会替换当前设备里的记录。建议先导出当前记录，确认继续吗？'))return;state=next;save();render();tickTimer();notify('备份已恢复。');}catch(err){notify('无法恢复：'+err.message);}finally{el.value='';}}
  });
  main.addEventListener('click',async e=>{
    const el=e.target.closest('button,a');if(!el)return;if(el.id==='checkin-link'){e.preventDefault();document.querySelector('#checkin')?.scrollIntoView({behavior:'smooth'});return;}if(!ensureToday())return;
    if(el.dataset.preview){preview=el.dataset.preview;trainView();return;}
    if(el.dataset.rest){startTimer(Number(el.dataset.rest));return;}
    const action=el.dataset.action;
    if(action==='recovered'){record().recovered=!record().recovered;save();render();notify('恢复安排已记录。');}
    if(action==='finish'){const p=C.plan(state,currentDay),w=record().workout;if(p.mode!=='train'||!w||!progress(w)){notify('先完成热身并记录实际做过的组。');return;}if(!confirm('保存今天实际完成的 '+progress(w)+' 组训练？未完成的组不会计入。'))return;w.completedAt=new Date().toISOString();state.timerEnd=0;save();tickTimer();location.hash='history';notify('本次训练已保存，去吃饭和休息吧。');}
    if(action==='export'){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),name=`循练备份-${currentDay}.json`;if(window.File&&navigator.canShare){const file=new File([blob],name,{type:'application/json'});if(navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:'循练训练备份'});return;}catch(err){if(err.name==='AbortError')return;}}}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);notify('已发起导出，请将文件保存到“文件”。');}
    if(action==='import')document.querySelector('#import-file').click();
    if(action==='backup-text'){const area=document.querySelector('#backup-text');area.value=JSON.stringify(state,null,2);area.hidden=false;area.focus();area.select();}
  });
  document.querySelector('#timer-add').onclick=()=>{state.timerEnd=Math.max(Date.now(),state.timerEnd||0)+30000;save();tickTimer();};
  document.querySelector('#timer-stop').onclick=()=>{state.timerEnd=0;save();tickTimer();};
  window.addEventListener('hashchange',()=>{render();window.scrollTo(0,0);});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){if(currentDay!==C.dateKey())render();tickTimer();}});
  window.addEventListener('pageshow',()=>{if(currentDay!==C.dateKey())render();tickTimer();});
  setInterval(()=>{tickTimer();if(currentDay!==C.dateKey())render();},1000);
  render();tickTimer();
  if('serviceWorker' in navigator && (location.protocol==='https:' || ['localhost','127.0.0.1'].includes(location.hostname))) navigator.serviceWorker.register('./sw.js').catch(()=>{});
})();
