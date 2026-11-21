const atlas = '../atlas/backslash/';
const neuro = 'https://eliminatenoise.github.io/NeuroTranslation/';

const models = {
  fingertipTouch: {
    title: 'When glass slips under a fingertip',
    url: '../fingertip-touch/',
    reading: 'Turn a supported fingertip above a glass plate. Compare whole-contact load, a local change in skin shape and counts of impulses in a single sensory fibre using a constructed example.'
  },
  crossPersonWrist: {
    title: 'Which wrist moved?',
    url: '../cross-person-wrist/',
    reading: 'Turn an invented reach in three dimensions. Switch the implant side or mirror the camera, then see how an earlier shoulder line gives both wrists a common frame.'
  },
  humanWrist: {
    title: 'One wrist reach',
    url: '../human-wrist/',
    reading: 'Turn a contact map in three dimensions, then follow both arms in the camera plane. Play the fictional trace or choose the verified AJILE12 second from your device.'
  },
  reachWeek: {
    title: 'One week later',
    url: '../reach-feedback/one-week/',
    reading: 'Turn the hand and forearm through two days of reaching. See when a new position becomes available, then count the spikes at one cortical contact.'
  },
  reachFeedback: {
    title: 'After the reach',
    url: '../reach-feedback/',
    reading: 'Turn the recorded hand and elbow markers, follow the handle in its own plane, and count the spikes that followed in sensory cortex. Which forecasts matched the measurements?'
  },
  reachPaths: {
    title: 'Hand and elbow forecasts',
    url: neuro + 'joint-alpha/shared-tasks/trajectory/reach/explore/',
    reading: 'A camera tracked a mark on a macaque’s hand and another near its elbow. Choose one of three reaches used to fit the models. Turn the saved forecasts in 3D, then reveal where each mark went over the next 100 milliseconds on the archive’s clock.'
  },
  kuopioLift: {
    title: 'Wrist forecasts for a box lift',
    url: neuro + 'joint-alpha/kuopio-lift/compare/',
    reading: 'Cameras tracked both wrists as people lifted a 12 kg box. Compare how closely wrist, muscle and floor readings predicted the right wrist’s position 100 milliseconds later.'
  },
  kuopioTurning: {
    title: 'Turning-lift wrist forecasts',
    url: neuro + 'joint-alpha/kuopio-turning-lift/',
    reading: 'What changes when a lift includes a turn? Compare the models trained on different lifts and see how adding muscle readings changed the wrist forecast.'
  },
  runReachForecast: {
    title: 'Run a reach forecast',
    url: neuro + 'joint-alpha/shared-tasks/trajectory/reach/density/second-day/predict/',
    reading: 'Give two models the same 20 readings of the hand, elbow and handle. One reads the recorded positions. The other uses changes from the last reading. Compare both forecasts with a path that continues the last measured speed and direction.'
  },
  cylinderRotation: {
    title: 'How the cylinder turns',
    url: '../cylinder-rotation/',
    reading: 'Turn a hand-held sensor through its recorded poses. Compare the predicted rate of rotation with ten later gyroscope readings.'
  },
  targetReach: {
    title: 'Carry a cylinder to a visual target',
    url: '../target-reach/',
    reading: 'Follow one cylinder through the air as a person carries it to one of nine cued locations. Compare the paths from separate left- and right-hand trials.'
  },
  graspSensors: {
    title: 'Forecast a grasp sensor reading',
    url: neuro + 'joint-alpha/grasp-sensor/',
    reading: 'A macaque pulled a sliding handle. What would its six sensors read 20 milliseconds later? Compare forecasts with and without spikes recorded from the brain. In each of two fits, a model without spikes gave the smallest error for handle travel.'
  },
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
  chairDirections: {
    title: 'Compare forecasts for standing up and sitting down',
    url: neuro + 'joint-alpha/chair-directions/',
    reading: 'Choose a movement and how many earlier camera positions to use. Compare a model trained to stand, one trained to sit, and one that learned both. The linked model runs locally with invented readings or a prepared camera history.'
  },
  squatMarkerGaps: {
    title: 'Gaps in camera readings',
    url: neuro + 'joint-alpha/missing-pelvis-markers/real-camera-gaps/',
    reading: 'During a deep squat, marks on the pelvis can drop out of the camera record. These saved forecasts use the heights still available to estimate the change in average marker height 100 milliseconds later. A score needs readings from the markers at both times. Muscle activity and nerve firing need their own measurements.'
  },
  walkingFloorForce: {
    title: 'See what the floor records as you walk',
    url: '../walking-force/',
    reading: 'Move through three recorded walks. Compare foot height with the load on the floor, then see what changes when you set the empty plates to zero.'
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
  contactForecast: {
    title: 'One push, two recording days',
    url: '../contact-forecast/',
    reading: 'Follow the arm on each day. Choose one of 26 shared recording contacts and compare its next 100 ms of activity with a forecast trained on the first day.'
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
  visceralClock: {
    title: 'Between two pressure readings',
    url: '../visceral-clock/',
    reading: 'Choose a mark in a mouse pelvic nerve recording and read the pressure inside the colon just before and just after it. The gauge took these readings a tenth of a second apart.'
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
  'map-brain2body': ['humanWrist', 'crossPersonWrist', 'contactForecast', 'reachFeedback', 'reachWeek', 'corticalReach', 'wrist', 'spindle', 'muscle', 'cortex', 'coverage', 'scalp'],
  'map-body2body': ['walkingInstructions','targetReach', 'cylinderRotation', 'stride', 'words', 'pedal'],
  'virtual-challenge': ['words', 'stride'],
  'motorsensation': ['contactForecast', 'fingertipTouch', 'reachFeedback', 'reachWeek', 'corticalReach', 'visualBalance', 'spindle', 'exercise', 'vibration'],
  'handler': ['graspBalanceRecording', 'graspSensors', 'targetReach', 'cylinderRotation', 'graspBalanceForecast'],
  'read-function': ['humanWrist', 'crossPersonWrist', 'vibration', 'trip', 'cortex', 'coverage', 'scalp'],
  '0.1': ['trip', 'wrist'],
  '0.2': ['trip'],
  '5.3': ['exercise', 'trip'],
  'composite': ['exercise', 'trip'],
  'mechanics': ['contactForecast', 'reachFeedback', 'reachWeek', 'corticalReach', 'stride', 'spindle', 'reflex', 'knee', 'overground', 'pedal'],
  'movement-model': ['graspBalanceForecast', 'reachPaths', 'runReachForecast', 'kuopioLift', 'kuopioTurning', 'chairDirections', 'squatMarkerGaps', 'walkingFloorForce', 'targetReach', 'cylinderRotation', 'graspBalanceRecording', 'stride', 'words', 'trip', 'knee', 'overground'],
  'myoception': ['muscle', 'spindle', 'muscleBalance', 'reflex', 'wrist', 'rhythm', 'overground'],
  'visceroception': ['visceral', 'pelvic', 'visceralClock', 'vibration'],
  'humans': ['humanWrist', 'fingertipTouch', 'crossPersonWrist', 'wrist', 'stride', 'cortex', 'coverage', 'scalp']
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
