const atlas = '../atlas/backslash/';

export const backslashDownload = {
  label: 'Download Backslash circuits and PDF (ZIP)',
  url: 'https://github.com/eliminatenoise/Interoceptomics/raw/main/downloads/backslash/Backslash-Atlas.zip',
  stagesWithResource: ['myoception', 'visceroception', 'composite', '5.3', 'mechanics']
};
const neuro = 'https://eliminatenoise.github.io/NeuroTranslation/';

const models = {
  area2Force: {
    title: 'Compare hand forecasts with measured force',
    url: 'area2-hand-force/index.html',
    reading: 'Compare six ways to forecast hand movement over 100 milliseconds. Choose a measured movement group or recorded trial type, then see how adding handle force or recorded sensory activity changes the error.'
  },
  handForecasts: {
    title: 'Compare hand forecasts from motion and brain activity',
    url: 'hand-position-forecast/index.html',
    reading: 'Compare six forecasts of hand movement over 100 milliseconds on three recorded days from one macaque. See how extending recent motion compares with using brain activity or averaging the two forecasts. The coordinate editor starts with invented values.'
  },
  pinchHook: {
    title: 'Pinch and hook forecasts',
    url: 'https://eliminatenoise.github.io/NeuroTranslation/finger-angle-forecast/gesture-replay/',
    reading: 'Choose a finger and use four seconds of movement to forecast its angle 320 milliseconds later. The example is invented. The results table compares ten methods on recorded pinches and hooks from four people.'
  },
  muscleChange: {
    title: 'Predict change inside two arm muscles',
    url: 'muscle-change-forecast/index.html',
    reading: 'Run five forecasts of how much the spacing of tracked points inside two arm muscles changes in 300 milliseconds. The example starts with invented readings. The lower table shows errors on six people from a reaching study.'
  },
  visualTailCohort: {
    title: 'Compare tail forecasts across 12 recordings',
    url: 'optic-flow-cohort/index.html',
    reading: 'Compare seven forecasts of tail-angle spread for all 12 May recordings or one recording at a time. Read the change in error when a model uses the logged visual command.'
  },
  visualTail: {
    title: 'Compare zebrafish tail forecasts',
    url: 'optic-flow/index.html',
    reading: 'Choose all 2,268 later windows or one of 20 one-minute blocks. Compare camera-based forecasts of tail-angle spread with forecasts that also use the logged visual command.'
  },
  fingertipTouch: {
    title: 'When glass slips under a fingertip',
    url: '../fingertip-touch/',
    reading: 'Turn a supported fingertip above a glass plate. Compare whole-contact load, a local change in skin shape and counts of impulses in a single sensory fibre using a constructed example.'
  },
  macaqueTouch: {
    title: 'Replay a macaque touch recording',
    url: '../fingertip-touch/#macaque-touch-history',
    reading: 'Read the four spike counts from one nerve fibre as satin moved across a macaque’s fingertip. A spike is a brief electrical impulse. Choose “Show recorded count” to see how many spikes followed in the next 20 milliseconds and compare that number with the forecast.'
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
    reading: 'Turn the recorded hand and elbow markers, follow the handle in its own plane, and count the spikes that followed in sensory cortex. Compare the forecasts with those measurements.'
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
    reading: 'Compare models trained on different lifting tasks. Check how adding muscle readings changes the wrist forecast during a lift with a turn.'
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
    reading: 'A macaque pulled a sliding handle. Compare forecasts for its six sensor readings 20 milliseconds later, with and without recorded brain spikes. In each of two fits, a model without spikes gave the smallest error for handle travel.'
  },
  graspBalanceRecording: {
    title: 'Replay the wrist and pelvis recordings',
    url: '../cross-limb-movement/',
    reading: 'One person reaches for an object. Another balances on a beam as the view turns. Follow the right wrist in the first study and a marker on the back of the pelvis in the second. Each path has its own scale and clock. Choose Last frame to read how far each marker moved from its own starting point in 125 milliseconds.'
  },
  graspBalanceForecast: {
    title: 'Check the wrist and pelvis forecasts',
    url: neuro + 'cross-limb-movement/#evidence',
    reading: 'Compare how closely earlier movement and muscle activity predicted the next 125 milliseconds in each task. The editable forecast starts from invented readings. Choose “Replay the wrist and pelvis recordings” to inspect two measured examples from model development.'
  },
  chairDirections: {
    title: 'Compare forecasts for standing up and sitting down',
    url: neuro + 'joint-alpha/chair-directions/',
    reading: 'Choose a movement and how many earlier camera positions to use. Compare a model trained to stand, one trained to sit, and one that learned both. The linked model runs locally with invented readings or a prepared camera history.'
  },
  standSitForce: {
    title: 'Standing and sitting force forecast',
    url: neuro + 'utah-stand-sit/',
    reading: 'Edit an invented 200 ms history of force on two floor plates. Compare three forecasts of vertical impulse, the upward force added up over the next 100 ms. Recordings from two of the three people reserved for testing passed the force check and supplied 230 forecast windows.',
    download: {
      label: 'Download the stand-and-sit model for offline use (ZIP)',
      url: 'https://raw.githubusercontent.com/eliminatenoise/NeuroTranslation/main/models/neurotranslate-0.0/stand-sit-force/Stand-and-sit-force-preview.zip'
    }
  },
  squatMarkerGaps: {
    title: 'Gaps in camera readings',
    url: neuro + 'joint-alpha/missing-pelvis-markers/real-camera-gaps/',
    reading: 'During a deep squat, marks on the pelvis can drop out of the camera record. These saved forecasts use the heights still available to estimate the change in average marker height 100 milliseconds later. A score needs readings from the markers at both times. Muscle activity and nerve firing need their own measurements.'
  },
  squatSensors: {
    title: 'Force in a squat',
    url: neuro + 'joint-alpha/missing-pelvis-markers/squat-sensor-comparison/',
    reading: 'Plates under the feet measured floor force. Electrodes on the thighs recorded electrical activity. Compare which readings helped predict the next 100 milliseconds when a camera reading was missing, using recordings from eight people.'
  },
  georgiaSquatSensors: {
    title: 'Floor force in a second squat study',
    url: neuro + 'joint-alpha/missing-pelvis-markers/squat-sensor-transfer/',
    reading: 'A model fitted in Kuopio forecast ordinary bodyweight squats by 10 people at Georgia Tech. Compare what measured floor force and electrical readings from the thighs add to the camera forecast when selected readings are deliberately hidden.'
  },
  runningStrideForecast: {
    title: 'Forecast a running stride',
    url: neuro + 'joint-alpha/missing-pelvis-markers/stride-demo/',
    reading: 'Choose 100, 150 or 250 camera frames per second. The demo uses invented readings and an earlier stride to predict how far the pelvis markers will rise or fall 100 milliseconds after the last reading.'
  },
  bathInclineForecast: {
    title: 'Usual pace on three slopes',
    url: neuro + 'joint-alpha/missing-pelvis-markers/running-incline/',
    reading: 'The forecast uses camera readings to predict how much pelvis height changes 100 milliseconds after the last reading. Compare the same 38 Bath runners at their usual treadmill pace setting on slopes of +1%, +6% and −4%.'
  },
  utahForceForecast: {
    title: 'Walking forecasts with measured force',
    url: 'walking-force-forecast.html',
    reading: 'Adding force readings improved the impulse forecast for all 16 walkers at 0.6 m/s. The companion links the recorded results and an offline model with invented inputs.'
  },
  walkingPassCount: {
    title: 'Compare walking forecasts by pass count',
    url: 'walking-pass-count/',
    reading: 'Compare five settings of the same walking model. Choose the force error or the loading probability error for nine recorded walks.'
  },
  forceWaist: {
    title: 'Forecast force and waist rotation',
    url: 'force-waist/forecast.html',
    reading: 'Edit earlier readings from a force plate or waist watch. Compare four forecasts for the next 100 milliseconds and open the recorded benchmark. The editable examples use generated values.'
  },
  forceForecast: {
    title: 'Compare seven force forecasts',
    url: 'force-forecast/forecast/',
    reading: 'Edit ten earlier force averages from one floor plate. Compare seven predictions for the next tenth of a second and check how they did when the plate was carrying more or less load. The editable examples use generated values.'
  },
  insolePressure: {
    title: 'Forecast insole pressure',
    url: 'insole-pressure/forecast.html',
    reading: 'Choose a pressure pad under the toes, front of the foot, arch or heel. Edit a generated reading, compare two forecasts for the next 100 milliseconds, and check the scores from recorded walks.'
  },
  walkingFloorForce: {
    title: 'See what the floor records as you walk',
    url: '../walking-force/',
    reading: 'Move through three recorded walks. Compare foot height with the load on the floor, then see what changes when you set the empty plates to zero.'
  },
  walkingInstructions: {
    title: 'Compare a usual walk with a fast walk',
    url: '../walking-instructions/',
    reading: 'Compare one person’s usual and fast walks at the same time after foot strike or the same fraction of a stride. Read how far the pelvis moved in each walk.'
  },
  melbourneWalkingForecast: {
    title: 'Forecast a walk with force',
    url: neuro + 'joint-alpha/missing-pelvis-markers/melbourne-force/',
    reading: 'A treadmill plate measures how hard a foot presses on it. Skin electrodes record electrical activity near muscles. In a separate Melbourne study, see whether earlier plate readings helped forecast how far markers on the pelvis would rise or fall over the next 100 milliseconds.'
  },
  visualBalance: {
    title: 'Replay a turn of the visual scene',
    url: '../visual-balance/',
    reading: 'A person walks a beam while the view in their headset turns. Pick a sample and compare scalp voltage with head and pelvis position. The recordings show movement. Describing what the person felt would require their own report.'
  },
  muscleBalance: {
    title: 'Compare standing and walking balance',
    url: '../muscle-and-motion/',
    reading: 'Follow the marker at the base of the spine as the view turns. Compare its path for one person standing and walking on a beam. Read the simultaneous signals from eight lower-leg electrodes.'
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
    reading: 'Rotate the cutaway, then count the spikes recorded from one sensory axon during passive stretch of a rat’s calf. Use the trial clock to compare five past intervals with the next 20 milliseconds.'
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
  heartBreathing: {
    title: 'Read the heartbeat and breathing traces',
    url: '../inside/',
    reading: 'Move the cursor through one recording. At each instant, compare the ECG with the voltages from the chest accelerometer and the breathing band.'
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
    reading: 'Use five earlier readings from the hips, knees and ankles to forecast both knee angles 15 frames later. Try the invented step, check the errors for the 12 walkers kept out of training, or open an original angle file to inspect the measured movement.'
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
    reading: 'Select walker S41, then S42. Compare how often each person’s knee movement and muscle activity repeat, then compare the muscle rate from the other walker. Each instrument supplies its own 40-second window.'
  },
  words: {
    title: 'Generate a walk or run from its name',
    url: neuro + 'word-motion/',
    reading: 'Type walk or run. The model generates a repeatable 3D sequence for that word. The comparison recording comes from the training set.'
  },
  neuroSurge: {
    title: 'Play NeuroSurge',
    url: neuro + 'previews/neurosurge/',
    reading: 'Choose Full or Lite. Press F to type a movement in the Command box. To follow your movement, press C, choose Start camera and allow video access when the browser asks.',
    externalOnly: true
  },
  wrist: {
    title: 'Compare wrist-angle forecasts',
    url: neuro + 'shared-motion/',
    reading: 'Choose right-wrist angles. Compare the forecasts made with earlier movement, forearm signals and scalp signals. Degree values describe a supported wrist-pointing task.'
  }
};

const choicesByStep = {
  'map-brain2body': ['humanWrist', 'handForecasts', 'muscleChange', 'area2Force', 'crossPersonWrist', 'contactForecast', 'reachFeedback', 'reachWeek', 'corticalReach', 'wrist', 'spindle', 'muscle', 'cortex', 'coverage', 'scalp'],
  'map-body2body': ['walkingInstructions', 'melbourneWalkingForecast', 'targetReach', 'cylinderRotation', 'stride', 'words', 'pedal', 'utahForceForecast'],
  'virtual-challenge': ['neuroSurge', 'words', 'stride'],
  'motorsensation': ['contactForecast', 'fingertipTouch', 'macaqueTouch', 'reachFeedback', 'reachWeek', 'corticalReach', 'visualBalance', 'spindle', 'exercise', 'vibration', 'visualTail', 'visualTailCohort'],
  'handler': ['graspBalanceRecording', 'graspSensors', 'targetReach', 'cylinderRotation', 'graspBalanceForecast'],
  'read-function': ['humanWrist', 'crossPersonWrist', 'vibration', 'trip', 'cortex', 'coverage', 'scalp', 'visualTail', 'visualTailCohort'],
  '0.1': ['trip', 'wrist'],
  '0.2': ['trip'],
  '5.3': ['exercise', 'trip'],
  'composite': ['exercise', 'overground', 'trip'],
  'mechanics': ['contactForecast', 'reachFeedback', 'reachWeek', 'corticalReach', 'area2Force', 'handForecasts', 'muscleChange', 'walkingPassCount', 'forceWaist', 'forceForecast', 'insolePressure', 'stride', 'spindle', 'reflex', 'knee', 'overground', 'pedal'],
  'movement-model': ['graspBalanceForecast', 'reachPaths', 'handForecasts', 'pinchHook', 'muscleChange', 'runReachForecast', 'kuopioLift', 'kuopioTurning', 'chairDirections', 'standSitForce', 'squatMarkerGaps', 'squatSensors', 'georgiaSquatSensors', 'runningStrideForecast', 'bathInclineForecast', 'walkingFloorForce', 'walkingPassCount', 'forceWaist', 'forceForecast', 'insolePressure', 'targetReach', 'cylinderRotation', 'graspBalanceRecording', 'stride', 'words', 'trip', 'knee', 'overground', 'utahForceForecast'],
  'myoception': ['muscle', 'muscleChange', 'spindle', 'muscleBalance', 'reflex', 'wrist', 'rhythm', 'overground', 'exercise'],
  'visceroception': ['visceral', 'pelvic', 'visceralClock', 'vibration', 'heartBreathing', 'exercise'],
  'humans': ['humanWrist', 'fingertipTouch', 'macaqueTouch', 'crossPersonWrist', 'wrist', 'stride', 'cortex', 'coverage', 'scalp']
};

const stepShortcut = { handler: 'graspBalanceRecording', mechanics: 'knee', 'movement-model': 'knee', myoception: 'rhythm' };

export function bindCompanions(section, shortcut, onSelection) {
  const select=section.querySelector('select');
  const button=section.querySelector('button');
  const external=section.querySelector('a');
  const download=document.createElement('a');
  const caption=section.querySelector('p');
  const mount=section.querySelector('.companion-frame');
  const choiceLabel=section.querySelector('label');
  let currentStep;
  let focusOnClose;

  function rememberSelection() {
    onSelection(currentStep,select.value);
  }

  function close() {
    focusOnClose=null;
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
    button.hidden=model.externalOnly===true;
    const needsAtlasDownload=model.url.startsWith(atlas) && !backslashDownload.stagesWithResource.includes(currentStep);
    const pack=model.download || (needsAtlasDownload ? backslashDownload : null);
    if(pack){
      download.href=pack.url;
      download.textContent=pack.label;
      external.after(download);
    }else{
      download.remove();
    }
    external.textContent=model.externalOnly ? 'Open NeuroSurge in a separate tab' : 'Open in a separate tab';
    external.setAttribute('aria-label',model.externalOnly ? external.textContent : model.title+' in a separate tab');
  }

  function open() {
    const model=models[select.value];
    if(model.externalOnly)return;
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
    if(mount.hidden){
      open();
    }else{
      const opener=focusOnClose || button;
      close();
      opener.focus();
    }
  });
  shortcut.addEventListener('click',()=>{
    const reader=stepShortcut[currentStep];
    if(select.value!==reader){
      select.value=reader;
      choose();
    }
    rememberSelection();
    if(mount.hidden)open();
    focusOnClose=shortcut;
    button.focus();
    section.scrollIntoView({block:'start'});
  });
  select.addEventListener('change',()=>{
    choose();
    rememberSelection();
  });
  return function showFor(stepId, requested) {
    currentStep=stepId;
    close();
    const reader=stepShortcut[stepId];
    shortcut.hidden=!reader;
    if(reader)shortcut.textContent=models[reader].title;
    const choices=choicesByStep[stepId] || [];
    section.hidden=!choices.length;
    if(!choices.length){
      select.replaceChildren();
      download.remove();
      external.removeAttribute('href');
      return false;
    }
    select.replaceChildren(...choices.map(k=>new Option(models[k].title,k)));
    const hasSelection=choices.includes(requested);
    if(hasSelection)select.value=requested;
    choiceLabel.textContent=choices.length===1?'Model for this step':'Model to explore';
    choose();
    return hasSelection;
  };
}
