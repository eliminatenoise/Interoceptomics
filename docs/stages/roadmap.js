// Slide numbers refer to the published technical script. Identifiers remain stable in shared links.
export const visions = {
  small: { name: 'Small vision', projects: 'NeuroTranslation × NeuroSurge' },
  big: { name: 'Big vision', projects: 'Interoceptomics' }
};

function step(id, title, slide, scene, question, evidence, companion) {
  return {id, title, slide, scene, question, evidence, companion};
}

function group(vision, title, steps) {
  return {vision, title, steps};
}

export const groups = [
  group('small', 'Map the movement', [
    step('map-brain2body','From brain signals to movement · Brain2Body',92,'body','Use the recorded wrist-pointing task to compare forecasts from wrist, forearm and scalp readings with the measured wrist angles. In the 3D diagram below, choose one of four limbs and move it through the programmed motion.','To test a prediction from brain activity, record electrical signals at the scalp while separately measuring how far the limb moves. Put both recordings on the same clock so the prediction can be checked against the movement at the time it was meant to happen. A sensor over a muscle picks up a different electrical signal.','AXIS'),
    step('map-body2body','Copy a movement · Body2Body',92,'body','Apply the same command to two bodies with different proportions. Compare how far each moves and when it reaches its endpoint.','Compare end position and timing in a shared coordinate frame. Record body dimensions and how well the cameras see each joint.'),
    step('virtual-challenge','Enter a virtual challenge',92,'box','Compare the timing of a virtual action with the game cue. A prerecorded movement can miss the cue.','Record who chose the action and compare the response with independently logged game events.'),
    step('learn-from-reference','Learn from a demonstration',92,'guide','Play the demonstration, then switch the guide off. Check which cues remain available to the learner.','Learning needs a later test without trainer-specific help, after matched practice. Keep any support the learner needs for basic access.'),
    step('motorsensation','Draft the paper · MotorSensation Is All You Need',92,'loop','An action changes what the body senses next. Test whether recording those changes improves a prediction.','Keep the instruction, movement attempt, observed outcome and later description distinct. Compare sensorimotor feedback predictions with independent sensory observations on reserved tasks.')
  ]),
  group('small', 'NeuroHandler', [
    step('handler','Manual dexterity',93,'body','Move through the reach, contact and return. Follow the hand’s position and the timing of contact.','The proposed experiment needs calibrated movement, contact and timing. Surface EMG records electrical activity in muscle. It cannot stand in for a recording from a nerve.','X01')
  ]),
  group('small', 'NeuroJuggler', [
    step('juggler','Multi-limb coordination',94,'juggle','Track the object’s path between the two hands.','Measure both limbs and the object on one clock. Score releases, catches and misses on reserved trials. The ball here follows a programmed arc.','X02')
  ]),
  group('small', 'NeuroBoxer', [
    step('boxer','Virtual timing task',95,'box','The avatar has a limited time to respond to each cue. Identify who supplied the timing of the response.','Log the cue, the action, the contributor and the outcome. This stage uses a virtual timing task.','X03'),
    step('boxer-read','Read',96,'body','Choose a limb to inspect the recordings available for its movement.','Align scalp EEG, surface EMG and calibrated motion when each is available. An absent sensor leaves a gap.','X03R'),
    step('boxer-write','Write',97,'box','Move the slider to send a command to the screen avatar. Follow the change in its position.','The viewer sends a display command only. A physical output would need its own verified route, independent response measures and safety evaluation.','X03W'),
    step('boxer-react','React',98,'box','Scrub from cue to response. A quick virtual response can come from a person, a model or an automatic rule.','Compare task event times with movement onset and accuracy. Test later performance after trainer guidance stops before making a learning claim.','X03X')
  ]),
  group('small', 'NeuroArcher', [
    step('archer','Two-hand coordination',99,'target','The two hands perform different tasks at the same time. Check whether a model preserves their relative timing and movement.','Track both limbs, the virtual object and the event together. The ring in this sketch is a screen-space target.','X04'),
    step('archer-read','Read',100,'body','Check which parts of each hand the camera can see at release. One hand can block the other.','Observe both limbs and the object in calibrated views on one clock. Record missing observations.','X04R'),
    step('archer-write','Write',101,'target','A software command changes a virtual endpoint. Follow where the coloured point moves.','Distinguish the command, displayed feedback and any separately measured participant movement.','X04W'),
    step('archer-react','React',102,'target','Measure how far the endpoint is from the virtual target at the event. Account for any help supplied by the agent.','Measure virtual target error and timing, then test a reserved variation without trainer-specific help.','X04X')
  ]),
  group('big', 'The five aims', [
    step('organism-platform','A model organism platform',37,'compare','Identify the feature of an organism that makes it suitable for the proposed experiment.','Compare repeatability, the task and measurement limits before carrying a result to another setting.'),
    step('human-feature','A specific human-related feature',38,'compare','Compare how the chosen human-related feature functions in each model. Two models can look similar and give different results.','Define one feature and its independent biological reference. A resemblance cannot establish human function.'),
    step('read-function','An instrument for reading function',39,'loop','Name the quantity the instrument measures and the independent reading you would use to check it.','State units, sampling, uncertainty and how the instrument compares with a separate measurement.'),
    step('write-function','A test of feedback',40,'guide','Test signal recording and feedback delivery separately.','Compare the response under intended feedback and matched controls. Timing and access to other cues matter.'),
    step('retained-skill','Assistance and learning',41,'guide','Switch the guide off to see which cues it supplied. A later test can distinguish retained skill from help supplied by the controller.','Compare matched practice, delayed retention and a different task, with necessary access support held constant.')
  ]),
  group('big', 'Stage 0 · Brain2Body', [
    step('0.1','NeuroTranslate',43,'loop','Specify the neural signal and the body measurement it should predict during the task. Assess the returning sensory signal separately.','Anatomy constrains the model. Check its prediction against independently recorded movement and compare it with a baseline on held-out trials.','P02'),
    step('0.2','Navigation',44,'straight','Compare the rat’s recorded positions on the W-track with the times two brain cells fired. Rotate the straight-corridor diagram below to inspect the proposed task.','The recorded rat ran in a separate study. The straight corridor shows the proposed Interoceptomics task. Its dot follows a programmed route. A test of navigation would also need to record which cues the animal could use.','M10'),
    step('0.3','NeuroReplay',45,'straight-replay','Replay the straight route. Switch from a matched guide to a delayed one and compare the two positions.','Replaying a route shows the reference signal. Test learning separately with matched practice, stale replay and a no-link control.','M12C'),
    step('0.4','Orientation',46,'winding','Follow the turn and check the direction the point faces as well as its position.','Record heading, available cues and the turns taken. Compare against a simple route-following baseline.','M03'),
    step('0.5','NeuroReplay',47,'winding-replay','Delay the guide and move through a corner to compare the replay with the moving point.','Compare the winding task independently with matched and delayed guidance. Retention needs a separate trainer-off test.','M13W')
  ]),
  group('big', 'Stage 1 · Geno-Humanisation', [
    step('1.1','Geno-Transplantation',49,'compare','The proposal concerns one human-related feature in a model organism. An illustration cannot show whether the feature works.','Compare the specified feature and its independent functional outcome. No change or outcome has been demonstrated.','B01')
  ]),
  group('big', 'Stage 2 · Xeno-Humanisation', [
    step('2.1','Xeno-Transplantation',51,'compare','The proposed comparison distinguishes the presence of donor tissue from its contribution to a function in the host.','Define a comparison and an independent outcome. The two schematic groups carry no tissue measurements.','B03')
  ]),
  group('big', 'From nervous system to movement', [
    step('composite','Neural Composite',52,'loop','A neural composite would link brain and spinal cord signals to muscle activity and movement during the same action. Follow the exercise and pressure loop in the atlas. Then choose Follow one stride from muscles to the floor. Move the slider from one right footfall to the next to see how three measurements change during the group’s average slow stride.','Markers tracked the body, skin electrodes measured voltage near muscles in the right leg, and plates measured the load against the floor. The instruments recorded the same walks. The curves line up by percentage of the stride. The walkers included can differ from curve to curve. No sensor recorded brain or spinal cord activity during these walks. The rat trip shows brain-cell firing and movement in a separate study with its own clock.'),
    step('mechanics','Physics Engine',53,'mechanics','Move the hinge to inspect its geometric limits. For the human knee, compare the forecast bend angle with the angle reconstructed from sensors worn during a walk.','The hinge shows a geometric limit. To test the mechanics of a walking leg, we also need segment masses and measurements of contact and force.'),
    step('environment','World Model',54,'winding','Compare the information available to the controller when it can see the route and when it receives only the next cue.','Record available information and the task outcome separately. This maze path is supplied to the display.'),
    step('stack','The three layers together',55,'loop','Trace how the neural composite, body mechanics and environment exchange information. An error in one layer can affect the next.','Tie each interface to named quantities, units and timing. A connected display does not establish end-to-end prediction.'),
    step('movement-model','Large Movement Models',56,'body','Compare two forecasts of both knee angles a quarter of a second ahead. One uses earlier joint angles. The other repeats an earlier stride.','One rule searched four seconds of knee movement for a stride to replay. The trained model, a transformer, saw 0.4 seconds of joint angles. Across 12 new walkers at 0.5 m/s, the rule missed the later knee angles by 3.54° on average. The model missed by 4.46° on the same forecasts. Some sensor files were processed as whole recordings, so live prediction remains untested.')
  ]),
  group('big', 'Stage 3 · Brain2Brain', [
    step('3.1','Mind-Meld',58,'guide','Identify the information a biological trainer could give a learner during the same task.','Track the sender, recipient, permitted sources of information and a separately measured outcome.'),
    step('3.2','NeuroTwin',59,'straight-replay','The biological trainer supplies the proposed reference. Follow the guide through the straight task.','Compare registered task events and observed choices with the reference. The term does not imply twin animals or a validated digital twin.'),
    step('3.3','NeuroTransfer',60,'guide','Test how information specific to the trainer affects the learner during the task.','Compare matched and mismatched information against equal practice. The display contains no recipient recordings.'),
    step('3.4','NeuroTwin',61,'winding-replay','Test whether the biological trainer’s reference transfers from the straight task to a winding route.','Declare which animal, task and cues change. Repeatability and transfer each need their own comparison.'),
    step('3.5','NeuroTransfer',62,'guide','After practice, remove the trainer’s guidance and test which parts of the task the learner retains.','Measure delayed trainer-off performance on a reserved variation. Keep any essential compensatory support in place.')
  ]),
  group('big', 'Stage 4 · Agent2Brain', [
    step('4.1','Mind-Merge',64,'guide','The proposed software trainer supplies the reference. Specify what the agent can observe and what feedback the learner can use.','Log information available to each participant and measure the learner’s action separately.'),
    step('4.2','NeuroTrainer',65,'straight-replay','Inspect the software trainer’s guidance in the straight task. Record whether the trainer can see the goal.','Compare guidance against a simple controller with the same information. Record when the learner receives it.'),
    step('4.3','NeuroTrainee',66,'straight','Follow the task from the learner’s position. Compare its observed response with the guidance it received.','Measure the learner’s choices and movement independently of the predicted path.'),
    step('4.4','NeuroTrainer',67,'winding-replay','Follow the software trainer through the winding task and check when each correction arrives.','Declare changed conditions and compare the timing with simpler, equally informed guidance.'),
    step('4.5','NeuroTrainee',68,'guide','Turn off guidance specific to the trainer. Test which parts of the task the learner can still perform.','Test equal practice, delayed retention and a reserved variation. No animal learning is represented by this animation.')
  ]),
  group('big', 'Stage 5 · Agent Vs Neurology', [
    step('5.1','Pick Your Disease',70,'compare','Choose a specific functional difficulty and an observation that would show whether it changes.','The proposal selects no condition here. A clinical claim would need a defined population and an independent functional endpoint.'),
    step('5.2','Pick Your Agent',71,'guide','Specify whether the agent predicts, plans or controls. Define the actions it can take.','Specify inputs, outputs and an equally informed baseline. This sketch only displays a reference signal.'),
    step('5.3','Neural Composite',72,'loop','Trace information from a neural source to a declared body variable and back through sensory feedback.','Keep brain, spine, peripheral, muscle and movement sources distinct. The illustration supplies no measured activity.'),
    step('5.4','Physics Engine',73,'mechanics','Move the linked segments. A body constrains where its endpoint can go.','Calibrated force, contact and displacement would check a dynamics model. This geometric hinge has no measured forces.'),
    step('5.5','World Model',74,'winding','Follow the supplied path. Compare the controller’s performance when it has less information about the route.','Document what the policy can observe, then change a reserved condition and measure the independent outcome.')
  ]),
  group('big', 'Back to human function', [
    step('myoception','Myoception',76,'mechanics','Myoception is our term for sensing muscle-driven movement, including how much a muscle stretches and how hard it pulls. Follow the sensory pathway from a muscle in the atlas. Then choose Count the spikes from a muscle spindle to see when one sensory nerve fibre fired as an apparatus stretched a rat’s calf.','An electrode recorded the rat’s nerve signal 20,000 times a second. Tendon force and apparatus position were sampled 2,000 times a second. In the human walking study, skin electrodes picked up muscle electrical activity and motion sensors estimated knee angle. Compare how often each pattern repeats. Separate device clocks leave open which muscle burst went with which knee bend. To find out what the walkers felt, you would need their own reports.'),
    step('visceroception','Visceroception',77,'loop','Visceroception is sensing conditions inside your organs, such as your bladder stretching as it fills. Trace a sensory pathway in the atlas. Then open a recording from a person at rest to see what changes around a heartbeat.','Skin electrodes recorded the heart’s electrical activity (ECG). An accelerometer on the chest picked up vibration, and a band around the chest responded to breathing. To know what the person felt, you would need their own report.'),
    step('humans','Then We Do It In Humans',78,'body','An animal result can inform the design of a human experiment. Test the proposed effect in people.','Define the human task and population, then obtain the measurements and independent comparison the test requires.')
  ])
];

export const allSteps = groups.flatMap(g => g.steps.map(s => ({...s, group:g})));
export const technicalPage = slide => slide + (slide >= 35 ? 2 : 1);
