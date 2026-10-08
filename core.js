(function (root) {
  'use strict';
  const KEY = 'daily-training-v1';
  function dateKey(date = new Date()) { return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-'); }
  function parseDay(value) { return new Date(value + 'T12:00:00'); }
  function addDays(key, amount) { const d = parseDay(key); d.setDate(d.getDate()+amount); return dateKey(d); }
  function validDay(x) { return typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x) && dateKey(parseDay(x)) === x; }
  function defaults(day = dateKey()) { return {version:1,settings:{start:day,days:[1,4],calories:2500,protein:170},days:{},weights:{},timerEnd:0}; }
  function dayRecord(state, day) { return state.days[day] || {}; }
  function checkinDefault() { return {food:'unknown',sore:'unknown',energy:'unknown',red:'unknown',recent:'unknown'}; }
  function nextType(state, day) {
    const logs = Object.entries(state.days).filter(([k,v])=> k < day && v.workout && v.workout.completedAt).sort(([a],[b])=>b.localeCompare(a));
    return logs.length && logs[0][1].workout.type === 'A' ? 'B' : 'A';
  }
  function plan(state, day, now = new Date()) {
    const record = dayRecord(state,day), c = record.checkin || checkinDefault();
    const base = {type:nextType(state,day),scheduled:state.settings.days.includes(parseDay(day).getDay()) && day >= state.settings.start};
    if (c.red === 'yes') return {...base,mode:'stop',title:'今天暂停训练',reason:'刺痛、肿胀、明显无力或头晕等情况需要先处理。持续或明显症状请就医，严重肌肉痛伴茶色尿应及时急诊。'};
    if (record.workout && record.workout.completedAt) return {...base,mode:'done',type:record.workout.type,title:'今天已经完成',reason:'本次训练已保存。接下来正常吃饭、休息，不需要再补一轮。'};
    if (!record.checkin || Object.values(c).some(v=>v === 'unknown')) return {...base,mode:'check',title:'先确认今天的状态',reason:'用 20 秒检查进食、酸痛和恢复，再决定今天怎么练。若今天仍只有一包麦片，先补一顿饭。'};
    if (c.food === 'low') return {...base,mode:'recover',title:'先吃好，再恢复',reason:'今天吃得太少，先补含主食、蛋白质和蔬菜的一餐。身体舒服后可以散步，先不做正式力量训练。'};
    if (c.sore === 'moderate' || c.energy === 'poor') return {...base,mode:'recover',title:'今天留给恢复',reason:'明显酸痛、活动受限或疲劳时，先休息。不要靠大重量把酸痛“练开”，也不用赶进度。'};
    if (c.recent === 'yes') return {...base,mode:'recover',title:'给肌肉一点时间',reason:'距离上次力量训练不足 48 小时，今天先安排恢复。下一次仍要确认酸痛和日常活动已经改善。'};
    const previous = Object.entries(state.days).filter(([k,v])=>k<day && v.workout && v.workout.completedAt).map(([,v])=>new Date(v.workout.completedAt).getTime()).filter(Number.isFinite);
    if (previous.length && now.getTime()-Math.max(...previous) < 48*3600000) return {...base,mode:'recover',title:'给肌肉一点时间',reason:'根据已保存记录，距离上次力量训练还不足 48 小时。今天先恢复，不追加力量课。'};
    if (!base.scheduled) return {...base,mode:'rest',title:'恢复也是计划的一部分',reason:'今天没有安排力量训练。可轻松走路；身体状态好时选择轻松跑或网球，不必每天都练。'};
    return {...base,mode:'train',title:'全身器械 · '+base.type,reason:c.sore==='mild'?'轻微酸胀且活动正常：先用轻重量热身评估。疼痛加重就停止，今天不加重量。':'把动作练稳，重量慢慢来。每组结束保留 3–4 次余力。'};
  }
  const EXERCISES = {
    leg:{id:'leg',name:'坐姿腿举',area:'大腿 / 臀部',reps:'10–12',rest:120,tip:'优先坐姿插片式腿举。背和臀贴靠垫，膝盖与脚尖方向一致；下放到骨盆仍稳定的范围，不猛顶膝。第一次请工作人员调好座椅。'},
    chest:{id:'chest',name:'器械推胸',area:'胸部 / 手臂',reps:'10–12',rest:120,tip:'调节座椅，让把手约在胸中部。肩膀放松，背贴靠垫；平稳推出和回放，肩部不舒服就停。'},
    pulldown:{id:'pulldown',name:'高位下拉',area:'背部 / 二头肌',reps:'10–12',rest:120,tip:'固定大腿，身体小幅后倾，将杆拉向上胸前方。不要拉到颈后或靠身体甩动。二头肌参与正常，酸痛时不强拉。'},
    curl:{id:'curl',name:'坐姿腿弯举',area:'大腿后侧',reps:'10–15',rest:90,tip:'请工作人员帮你把膝关节对准机器转轴，固定大腿垫。平稳弯曲和回放，不弹起配重。'},
    lateral:{id:'lateral',name:'侧平举机',area:'肩部 · 可选',reps:'12–15',rest:90,optional:true,tip:'轻重量，肩不耸起，抬到舒适范围。有器械再做；没有或时间紧可以跳过，不必用哑铃替代。'},
    row:{id:'row',name:'胸托划船机',area:'背部 / 二头肌',reps:'10–12',rest:120,tip:'胸部贴靠垫，肩膀放松，肘部向后拉；不要用腰甩动，不必过度后拉。请工作人员帮你调节把手距离。'},
    reverse:{id:'reverse',name:'反向飞鸟机',area:'肩后侧 · 可选',reps:'12–15',rest:90,optional:true,tip:'先请工作人员演示座椅朝向和把手设置。轻重量缓慢打开双臂，肩不耸起；肩部疼痛或没有器械就跳过。'}
  };
  function exercises(type) { return (type==='B'?['leg','chest','row','curl','reverse']:['leg','chest','pulldown','curl','lateral']).map(k=>EXERCISES[k]); }
  function validateDays(days) { if (![2,3].includes(days.length) || new Set(days).size!==days.length || days.some(d=>!Number.isInteger(d)||d<0||d>6)) return false; const s=[...days].sort((a,b)=>a-b); return s.every((d,i)=>((s[(i+1)%s.length]-d+7)%7)>=2); }
  function validateBackup(data) {
    if (!data || data.version!==1 || !data.settings || !validateDays(data.settings.days||[]) || !validDay(data.settings.start)) throw Error('备份的计划设置不完整。');
    if (!(data.settings.calories>=1500 && data.settings.calories<=4000 && data.settings.protein>=80 && data.settings.protein<=220)) throw Error('备份的饮食目标超出支持范围。');
    const clean=defaults(data.settings.start); clean.settings={start:data.settings.start,days:[...data.settings.days],calories:Number(data.settings.calories),protein:Number(data.settings.protein)};
    const choices={food:['unknown','ok','low'],sore:['unknown','none','mild','moderate'],energy:['unknown','ok','poor'],red:['unknown','no','yes'],recent:['unknown','no','yes']};
    if (typeof data.days!=='object' || !data.days || Array.isArray(data.days) || Object.keys(data.days).length>5000) throw Error('备份的日期记录无效。');
    for (const [day,r] of Object.entries(data.days)) {
      if (!validDay(day) || !r || typeof r!=='object') throw Error('备份含无效日期。');
      const out={};
      if (r.checkin) { out.checkin={}; for(const [k,values] of Object.entries(choices)) { if(!values.includes(r.checkin[k])) throw Error('备份的状态检查无效。'); out.checkin[k]=r.checkin[k]; } }
      if(r.habits) out.habits=Object.fromEntries(['breakfast','lunch','dinner','protein','sleep','walk'].map(k=>[k,r.habits[k]===true]));
      if(r.recovered) out.recovered=true;
      if(r.workout) {
        const w=r.workout; if(!['A','B'].includes(w.type)) throw Error('备份的训练类型无效。');
        out.workout={type:w.type,sets:{},warmup:w.warmup===true,completedAt:null,startedAt:null};
        for(const key of ['completedAt','startedAt']) if(w[key]) { if(!Number.isFinite(Date.parse(w[key]))) throw Error('备份的训练时间无效。'); out.workout[key]=new Date(w[key]).toISOString(); }
        for(const ex of exercises(w.type)) {
          const rows=w.sets?.[ex.id]||[]; if(!Array.isArray(rows)||rows.length>2) throw Error('备份的组数无效。');
          out.workout.sets[ex.id]=rows.map(s=>{const weight=s.weight===''?'':Number(s.weight),reps=s.reps===''?'':Number(s.reps); if((weight!==''&&(!Number.isFinite(weight)||weight<0||weight>500))||(reps!==''&&(!Number.isInteger(reps)||reps<0||reps>100))) throw Error('备份的重量或次数无效。'); return {weight,reps,done:s.done===true};});
        }
      }
      clean.days[day]=out;
    }
    if(data.weights && typeof data.weights==='object') for(const [d,v] of Object.entries(data.weights)) { if(!validDay(d)||!Number.isFinite(Number(v))||v<30||v>250) throw Error('备份的体重记录无效。'); clean.weights[d]=Number(v); }
    return clean;
  }
  function weekDates(day) {const d=parseDay(day); return Array.from({length:7},(_,i)=>addDays(day,-((d.getDay()+6)%7)+i));}
  const api={KEY,dateKey,parseDay,addDays,validDay,defaults,dayRecord,checkinDefault,nextType,plan,exercises,validateDays,validateBackup,weekDates};
  if(typeof module!=='undefined'&&module.exports) module.exports=api; else root.TrainingCore=api;
})(typeof globalThis!=='undefined'?globalThis:this);
