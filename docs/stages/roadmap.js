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
    step('map-brain2body','From brain signals to movement · Brain2Body',92,'body','How much can the scalp and forearm tell us about the next turn of the wrist? Try the recorded pointing task below. Farther down, the drawing lets you bend any of four limbs through a programmed movement.','To test a prediction from brain activity, record electrical signals at the scalp while separately measuring how far the limb moves. Put both recordings on the same clock so the prediction can be checked against the movement at the time it was meant to happen. A sensor over a muscle picks up a different electrical signal.','AXIS'),
    step('map-body2body','Copy a movement · Body2Body',92,'body','The same command moves two bodies with different proportions. How much of the intended movement carries over?','Compare end position and timing in a shared coordinate frame. Record body dimensions and how well the cameras see each joint.'),
    step('virtual-challenge','Enter a virtual challenge',92,'box','Can the model act in time for a game cue? A prerecorded path can look convincing and still miss the cue.','Record who chose the action and compare the response with independently logged game events.'),
    step('learn-from-reference','Learn from a demonstration',92,'guide','Play through a reference, then switch the guide off. Which information does the learner still have?','Learning needs a later test without trainer-specific help, after matched practice. Keep any support the learner needs for basic access.'),
    step('motorsensation','Draft the paper · MotorSensation Is All You Need',92,'loop','An action changes what the body senses next. Can observations of those consequences improve a prediction?','Keep the instruction, movement attempt, observed outcome and later description distinct. Compare sensorimotor feedback predictions with independent sensory observations on reserved tasks.')
  ]),
  group('small', 'NeuroHandler', [
    step('handler','Manual dexterity',93,'body','A hand reaches, makes contact and returns. One convincing pose can miss almost the whole action. Scrub through the movement.','The proposed experiment needs calibrated movement, contact and timing. Surface EMG records electrical activity in muscle. It cannot stand in for a recording from a nerve.','X01')
  ]),
  group('small', 'NeuroJuggler', [
    step('juggler','Multi-limb coordination',94,'juggle','Follow the object between the two hands. It has a trajectory of its own.','Measure both limbs and the object on one clock. Score releases, catches and misses on reserved trials. The ball here follows a programmed arc.','X02')
  ]),
  group('small', 'NeuroBoxer', [
    step('boxer','Virtual timing task',95,'box','A cue appears. The avatar has a limited interval in which to respond. Who supplied the useful timing?','Log the cue, the action, the contributor and the outcome. This stage uses a virtual timing task.','X03'),
    step('boxer-read','Read',96,'body','Which observations describe the action? Choose a limb and inspect its recording coverage.','Align scalp EEG, surface EMG and calibrated motion when each is available. An absent sensor leaves a gap.','X03R'),
    step('boxer-write','Write',97,'box','Move the slider. Its destination is a screen avatar. What changed on the screen?','The viewer sends a display command only. A physical output would need its own verified route, independent response measures and safety evaluation.','X03W'),
    step('boxer-react','React',98,'box','Scrub from cue to response. A quick virtual response can come from a person, a model or an automatic rule.','Compare task event times with movement onset and accuracy. Test later performance after trainer guidance stops before making a learning claim.','X03X')
  ]),
  group('small', 'NeuroArcher', [
    step('archer','Two-hand coordination',99,'target','Two hands perform different jobs at the same moment. Can a model preserve that relationship?','Track both limbs, the virtual object and the event together. The ring in this sketch is a screen-space target.','X04'),
    step('archer-read','Read',100,'body','One camera can lose a hand behind the other. Which parts are visible at the release event?','Observe both limbs and the object in calibrated views on one clock. Record missing observations.','X04R'),
    step('archer-write','Write',101,'target','A software command changes a virtual endpoint. Follow where the coloured point moves.','Distinguish the command, displayed feedback and any separately measured participant movement.','X04W'),
    step('archer-react','React',102,'target','At the event, how far is the endpoint from its intended location? Would help from the agent account for the result?','Measure virtual target error and timing, then test a reserved variation without trainer-specific help.','X04X')
  ]),
  group('big', 'The five aims', [
    step('organism-platform','A model organism platform',37,'compare','Which aspect of one organism would make a particular question easier to test?','Compare repeatability, the task and measurement limits before carrying a result to another setting.'),
    step('human-feature','A specific human-related feature',38,'compare','Two models can resemble one another while the feature of interest behaves differently.','Define one feature and its independent biological reference. A resemblance cannot establish human function.'),
    step('read-function','An instrument for reading function',39,'loop','A useful instrument reports a quantity someone else can check. What quantity is being read?','State units, sampling, uncertainty and how the instrument compares with a separate measurement.'),
    step('write-function','A test of feedback',40,'guide','Reading a signal and delivering useful information are two different experiments.','Compare the response under intended feedback and matched controls. Timing and access to other cues matter.'),
    step('retained-skill','Assistance and learning',41,'guide','Did the learner improve, or did the controller keep supplying the answer? Switch the guide off to see what the diagram removes.','Compare matched practice, delayed retention and a different task, with necessary access support held constant.')
  ]),
  group('big', 'Stage 0 · Brain2Body', [
    step('0.1','NeuroTranslate',43,'loop','Which neural observation predicts which body variable in a declared task? The return signal asks a different question.','Anatomy constrains a model. Independently recorded movement, a baseline and a held-out result determine what its prediction earns.','P02'),
    step('0.2','Navigation',44,'straight','Where was the animal when a brain cell fired? Try a published W-track recording, then turn the straight-corridor sketch below to explore the proposed experiment.','The recorded rat ran in a separate study. The straight corridor shows the proposed Interoceptomics task. Its dot follows a programmed route. A test of navigation would also need to record which cues the animal could use.','M10'),
    step('0.3','NeuroReplay',45,'straight-replay','Replay the straight route. Switch from a matched guide to a delayed one and compare the two positions.','A saved example can be replayed without teaching anyone. Test matched practice, stale replay and no-link controls.','M12C'),
    step('0.4','Orientation',46,'winding','Turn a corner. Position alone no longer tells you which way the moving point faces.','Record heading, available cues and the turns taken. Compare against a simple route-following baseline.','M03'),
    step('0.5','NeuroReplay',47,'winding-replay','What happens to a replay around a bend? Delay the guide and scrub past a corner.','Compare the winding task independently with matched and delayed guidance. Retention needs a separate trainer-off test.','M13W')
  ]),
  group('big', 'Stage 1 · Geno-Humanisation', [
    step('1.1','Geno-Transplantation',49,'compare','The proposal concerns one human-related feature in a model organism. An illustration cannot show whether the feature works.','Compare the specified feature and its independent functional outcome. No change or outcome has been demonstrated.','B01')
  ]),
  group('big', 'Stage 2 · Xeno-Humanisation', [
    step('2.1','Xeno-Transplantation',51,'compare','This stage asks what a donor tissue contributes to a host. Its presence and its contribution are separate observations.','Define a comparison and an independent outcome. The two schematic groups carry no tissue measurements.','B03')
  ]),
  group('big', 'From nervous system to movement', [
    step('composite','Neural Composite',52,'loop','A brain signal, a spinal observation, and a muscle signal have different origins. How much of the path is actually measured?','A neural correlate is a measured association with a task or movement. A neural composite brings specified observations and model components together. Keep each source, time, unit and uncertainty visible.'),
    step('mechanics','Physics Engine',53,'mechanics','Once a command leaves a model, what sets the possible motion of a joint?','A mechanical model needs joint limits, contact, mass and external checks. The hinge here only demonstrates a geometric constraint.'),
    step('environment','World Model',54,'winding','Change the environment and the task changes with it. Can the controller see the route or only the next cue?','Record available information and the task outcome separately. This maze path is supplied to the display.'),
    step('stack','The three layers together',55,'loop','Neural composite, mechanics and environment meet at their interfaces. An error in one layer can change the next.','Tie each interface to named quantities, units and timing. A connected display does not establish end-to-end prediction.'),
    step('movement-model','Large Movement Models',56,'body','Can a movement model predict what happens next with only the input available at that moment?','Evaluate each body region and recording separately against simple alternatives. See the recording study in Small vision for an actual result.')
  ]),
  group('big', 'Stage 3 · Brain2Brain', [
    step('3.1','Mind-Meld',58,'guide','What information could one biological trainer contribute to another learner in the same task?','Track the sender, recipient, permitted sources of information and a separately measured outcome.'),
    step('3.2','NeuroTwin',59,'straight-replay','The biological trainer supplies the proposed reference. Follow the guide through the straight task.','Compare registered task events and observed choices with the reference. The term does not imply twin animals or a validated digital twin.'),
    step('3.3','NeuroTransfer',60,'guide','What difference would trainer-specific information make to the learner during the task?','Compare matched and mismatched information against equal practice. The display contains no recipient recordings.'),
    step('3.4','NeuroTwin',61,'winding-replay','A winding route changes the demands on the trainer. Would a reference carry over to that new task?','Declare which animal, task and cues change. Repeatability and transfer each need their own comparison.'),
    step('3.5','NeuroTransfer',62,'guide','Remove the guide after practice. Has the learner retained anything when the trainer falls silent?','Measure delayed trainer-off performance on a reserved variation. Keep any essential compensatory support in place.')
  ]),
  group('big', 'Stage 4 · Agent2Brain', [
    step('4.1','Mind-Merge',64,'guide','Now a software agent supplies the reference. Which part of the task can it see and which feedback can the learner use?','Log information available to each participant and measure the learner’s action separately.'),
    step('4.2','NeuroTrainer',65,'straight-replay','Inspect the proposed software trainer in the straight task. A system with access to the goal can appear very capable.','Compare guidance against a simple controller with the same information. Record when the learner receives it.'),
    step('4.3','NeuroTrainee',66,'straight','What did the learner do with the guidance? Trace the task from the learner’s position.','Measure choices and movement independently. A predicted path alone cannot answer this question.'),
    step('4.4','NeuroTrainer',67,'winding-replay','Follow the proposed software trainer through a winding task. Do its corrections still arrive in time?','Declare changed conditions and compare the timing with simpler, equally informed guidance.'),
    step('4.5','NeuroTrainee',68,'guide','Turn off trainer-specific guidance. What part of the task could the learner still perform?','Test equal practice, delayed retention and a reserved variation. No animal learning is represented by this animation.')
  ]),
  group('big', 'Stage 5 · Agent Vs Neurology', [
    step('5.1','Pick Your Disease',70,'compare','Start with a specific functional difficulty. What observation could show that it has changed?','The proposal selects no condition here. A clinical claim would need a defined population and an independent functional endpoint.'),
    step('5.2','Pick Your Agent',71,'guide','A predictor, a planner and a controller have different jobs. What is the chosen agent allowed to do?','Specify inputs, outputs and an equally informed baseline. This sketch only displays a reference signal.'),
    step('5.3','Neural Composite',72,'loop','Trace information from a neural source to a declared body variable and back through sensory feedback.','Keep brain, spine, peripheral, muscle and movement sources distinct. The illustration supplies no measured activity.'),
    step('5.4','Physics Engine',73,'mechanics','Move the linked segments. A body constrains where its endpoint can go.','Calibrated force, contact and displacement would check a dynamics model. This geometric hinge has no measured forces.'),
    step('5.5','World Model',74,'winding','Follow the supplied path through the environment. Would the same controller work with less information about the route?','Document what the policy can observe, then change a reserved condition and measure the independent outcome.')
  ]),
  group('big', 'Back to human function', [
    step('myoception','Myoception',76,'mechanics','As a limb moves, its muscles change length and load. Which signals tell us about that change?','Motion and surface EMG give different observations. A sensory claim needs its own measurement.'),
    step('visceroception','Visceroception',77,'loop','What could the experiment say about sensing the organs during movement?','Pair a declared physiological observation with its timing and context. Movement alone cannot tell us what someone felt.'),
    step('humans','Then We Do It In Humans',78,'body','A result in an animal can suggest a human experiment. The human result still has to be earned.','Choose the task, population, measurement and independent comparison again. A viewer supplies none of the missing observations.')
  ])
];

export const allSteps = groups.flatMap(g => g.steps.map(s => ({...s, group:g})));
export const technicalPage = slide => slide + (slide >= 35 ? 2 : 1);
