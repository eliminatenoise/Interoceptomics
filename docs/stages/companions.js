const atlas = '../atlas/backslash/';
const neuro = 'https://eliminatenoise.github.io/NeuroTranslation/';

const models = {
  graspBalanceRecording: {
    title: 'Replay the wrist and pelvis recordings',
    url: '../cross-limb-movement/',
    reading: 'One person reaches for an object. Another balances on a beam as the view turns. Follow the right wrist in the first study and a marker on the back of the pelvis in the second. Each path has its own scale and clock. Choose Last frame to read how far each marker moved from its own starting point in 125 milliseconds.'
  },
  graspBalanceForecast: {
    title: 'Check the wrist and pelvis forecasts',
    url: neuro + 'cross-limb-movement/#evidence',
    reading: 'How closely did earlier movement and muscle activity predict the next 125 milliseconds? Compare the errors for each task. The editable forecast starts from invented readings. Choose “Replay the wrist and pelvis recordings” to inspect two measured examples from model development.'
  },
  walkingInstructions: {
    title: 'Compare a usual walk with a fast walk',
    url: '../walking-instructions/',
    reading: 'One person walked at their usual pace and at a fast pace. Match the walks at the same time after foot strike or at the same fraction of a stride. How far did the pelvis travel in each?'
  },
  visualBalance: {
    title: 'Replay a turn of the visual scene',
    url: '../visual-balance/',
    reading: 'A person walks a beam while the view in their headset turns. Pick a sample and compare scalp voltage with the positions of the head and pelvis. The recordings show how the body moved. What the person felt is a separate question.'
  },
  muscleBalance: {
    title: 'Compare standing and walking balance',
    url: '../muscle-and-motion/',
    reading: 'When the view turns, where does a marker at the base of the spine go? Compare the paths from one person standing and walking on a beam. Move through each recording to see what eight electrodes on the lower legs picked up at the same time.'
  },
  pedal: {
    title: 'Compare shin activity and pedal load',
    url: '../pedal-load/',
    reading: 'A seated person tries to lift a foot strapped to a fixed pedal. Turn the reference leg, inspect the load cell, and compare earlier muscle activity with the load change 100 samples later.'
  },
  scalp: {
    title: 'Turn the scalp and right arm',
    url: '../scalp-and-arm/',
    reading: 'Choose one of 61 scalp electrodes on a standard head. Follow a right-arm cue and compare four measured changes at the scalp with the eye and movement sensors.'
  },
  coverage: {
    title: 'Compare where electrodes sat in five people',
    url: '../cortex-coverage/',
    reading: 'Compare contact counts for the same brain regions, then inspect each participant’s original surface and recording sites.'
  },
  cortex: {
    title: 'See electrical activity on the recorded cortex',
    url: '../recorded-cortex/',
    reading: 'Explore electrical power from 46 contacts in one person who was shown finger cues. Load their own cortical surface to locate the recording contacts.'
  },
  corticalReach: {
    title: 'The bump and the reach',
    url: '../cortical-reach/',
    reading: 'A robot pushed a macaque’s handle before a visual cue prompted a reach. Replay ten tracked arm sites and 30 cortical units, then compare the next 100 ms of handle travel with the forecast.'
  },
  spindle: {
    title: 'Count the spikes from a muscle spindle',
    url: '../muscle-spindle/',
    reading: 'During passive stretch of a rat calf, how many spikes travel along one sensory axon? Turn the cutaway, then use the trial clock to compare five past intervals with the following 20 milliseconds.'
  },
  muscle: {
    title: 'Trace a signal from a muscle',
    url: atlas + '#route=muscle&step=0',
    reading: 'Start at a muscle spindle or tendon organ. Follow the sensory route through spinal and brain relays to cortex. The coloured anatomy shows where the structures lie.'
  },
  reflex: {
    title: 'Trace a stretch reflex',
    url: atlas + '#route=reflex&step=1',
    reading: 'A stretch signal can recruit a motor neuron in the spinal cord. The atlas also follows a separate branch to the cerebellum.'
  },
  visceral: {
    title: 'Trace a signal from an organ',
    url: atlas + '#route=visceral&step=0',
    reading: 'Stretch in an artery sends sensory information towards the brainstem. Follow the route to a labelled human donor section of the solitary nucleus.'
  },
  exercise: {
    title: 'Follow the exercise and pressure loop',
    url: atlas + '#route=exercise&step=0',
    reading: 'During exercise, working muscles send sensory signals towards cardiovascular centres. Follow the outgoing response and returning pressure signals across different anatomical preparations.'
  },
  pelvic: {
    title: 'Trace bladder filling and emptying',
    url: atlas + '#route=pelvis&step=0',
    reading: 'Compare a stretch signal from the bladder with the autonomic and skeletal motor routes involved in emptying it.'
  },
  vibration: {
    title: 'Check a chest-vibration forecast',
    url: '../inside/recording-forecast.html',
    reading: 'See what chest vibration, breathing and skin electrodes predict. Then reveal the voltage recorded by the chest sensor 80 milliseconds later. A report of what the person felt would need a separate measurement.'
  },
  trip: {
    title: 'Compare firing and movement on a recorded trip',
    url: neuro + 'population-motion/',
    reading: 'Choose one of twelve cutoffs on a recorded rat trip. Compare earlier camera motion alone with correctly timed or earlier-trip brain-cell firing, then reveal the measured distance. Three test rats supplied the across-animal comparison.'
  },
  stride: {
    title: 'Continue a measured stride',
    url: neuro + 'stride/',
    reading: 'Give the model half a second of recorded walking or running. Rotate its 3D forecast and check where the 18 marker-derived body sites went during the next 0.60 seconds.'
  },
  knee: {
    title: 'Compare knee-angle forecasts',
    url: neuro + 'knee-motion/',
    reading: 'Five readings from the hips, knees and ankles go in. How far will each knee bend 15 frames later? Try the invented step, check the errors for 12 people whose walks were kept out of training, or open an original angle file to see what followed.'
  },
  overground: {
    title: 'Follow one stride from muscles to the floor',
    url: '../stride-signals/index.html',
    reading: 'Turn the figure and scrub through one slow stride. Compare the movement of 52 skin markers, electrical activity in eight right-leg muscles and force on two floor plates.'
  },
  rhythm: {
    title: 'Compare muscle and knee rhythms',
    url: neuro + 'gait-rhythm/',
    start: '#case-title',
    reading: 'Try walker S41, then S42. How often do the leg muscles and knees repeat their patterns? Compare each walker’s knee rate with their own muscle rate and with another person’s. Each instrument supplies its own 40-second window.'
  },
  words: {
    title: 'Generate a walk or run from its name',
    url: neuro + 'word-motion/',
    reading: 'Type walk or run. The model generates a repeatable 3D sequence for that word. The comparison recording comes from the training set.'
  },
  wrist: {
    title: 'Compare wrist-angle forecasts',
    url: neuro + 'shared-motion/',
    reading: 'Choose right-wrist angles. Compare the forecasts made with earlier movement, forearm signals and scalp signals. Degree values describe a supported wrist-pointing task.'
  }
};

const choicesByStep = {
  'map-brain2body': ['corticalReach', 'wrist', 'spindle', 'muscle', 'cortex', 'coverage', 'scalp'],
  'map-body2body': ['walkingInstructions', 'stride', 'words', 'pedal'],
  'virtual-challenge': ['words', 'stride'],
  'motorsensation': ['corticalReach', 'visualBalance', 'spindle', 'exercise', 'vibration'],
  'handler': ['graspBalanceRecording', 'graspBalanceForecast'],
  'read-function': ['vibration', 'trip', 'cortex', 'coverage', 'scalp'],
  '0.1': ['trip', 'wrist'],
  '0.2': ['trip'],
  '5.3': ['exercise', 'trip'],
  'composite': ['exercise', 'trip'],
  'mechanics': ['corticalReach', 'stride', 'spindle', 'reflex', 'knee', 'overground', 'pedal'],
  'movement-model': ['graspBalanceForecast', 'graspBalanceRecording', 'stride', 'words', 'trip', 'knee', 'overground'],
  'myoception': ['muscle', 'spindle', 'muscleBalance', 'reflex', 'wrist', 'rhythm', 'overground'],
  'visceroception': ['visceral', 'pelvic', 'vibration'],
  'humans': ['wrist', 'stride', 'cortex', 'coverage', 'scalp']
};

const stepShortcut = { handler: 'graspBalanceRecording', mechanics: 'knee', 'movement-model': 'knee', myoception: 'rhythm' };

export function bindCompanions(section, shortcut) {
  const select=section.querySelector('select');
  const button=section.querySelector('button');
  const external=section.querySelector('a');
  const caption=section.querySelector('p');
  const mount=section.querySelector('.companion-frame');
  const choiceLabel=section.querySelector('label');
  let previousStep;

  function close() {
    mount.replaceChildren();
    mount.hidden=true;
    button.textContent='Open here';
    button.setAttribute('aria-expanded','false');
  }

  function choose() {
    close();
    const model=models[select.value];
    caption.textContent=model.reading;
    external.href=model.url;
    external.textContent='Open in a separate tab';
    external.setAttribute('aria-label',model.title+' in a separate tab');
  }

  function open() {
    const model=models[select.value];
    const frame=document.createElement('iframe');
    frame.title=model.title;
    frame.setAttribute('allow',"camera 'none'; microphone 'none'; geolocation 'none'");
    frame.referrerPolicy='no-referrer';
    frame.src=model.url+(model.start || '');
    mount.replaceChildren(frame);
    mount.hidden=false;
    button.setAttribute('aria-expanded','true');
    button.textContent='Close model';
  }

  button.addEventListener('click',()=>{
    if(mount.hidden)open();
    else close();
  });
  shortcut.addEventListener('click',()=>{
    const reader=stepShortcut[previousStep];
    if(select.value!==reader){
      select.value=reader;
      choose();
    }
    if(mount.hidden)open();
    button.focus();
    section.scrollIntoView({block:'start'});
  });
  select.addEventListener('change',choose);
  return function showFor(stepId) {
    if(stepId===previousStep)return;
    previousStep=stepId;
    close();
    const reader=stepShortcut[stepId];
    shortcut.hidden=!reader;
    if(reader)shortcut.textContent=models[reader].title;
    const choices=choicesByStep[stepId] || [];
    section.hidden=!choices.length;
    if(!choices.length){select.replaceChildren();external.removeAttribute('href');return;}
    select.replaceChildren(...choices.map(k=>new Option(models[k].title,k)));
    choiceLabel.textContent=choices.length===1?'Model for this step':'Model to explore';
    choose();
  };
}
