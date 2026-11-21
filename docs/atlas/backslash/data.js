export const sources = {
  heartbeat:['Critchley and colleagues · human heartbeat-task imaging','https://doi.org/10.1038/nn1176'],
  sensation:['Khalsa and colleagues · a human lesion study of heartbeat sensation','https://doi.org/10.1038/nn.2411'],
  voiding:['Blok and colleagues · human imaging during voiding','https://pubmed.ncbi.nlm.nih.gov/9055802/'],
  bowelreflex:['Local bowel response · isolated guinea-pig colon experiment','https://pubmed.ncbi.nlm.nih.gov/1004629/'],
  allen:['Allen Human Reference Atlas – 3D, 2020, version 1.0.0','https://download.alleninstitute.org/informatics-archive/allen_human_reference_atlas_3d_2020/version_1/'],
  hra:['Human Reference Atlas, female united reference organs, v1.10','https://doi.org/10.48539/HBM637.DWBM.744'],
  stem:['Coulombe and colleagues, 2021 · human brainstem atlas','https://doi.org/10.3389/fnana.2021.627656'],
  exercise:['Amann and colleagues · muscle feedback during exercise in humans','https://pmc.ncbi.nlm.nih.gov/articles/PMC2963332/'],
  columns:['Human dorsal column nuclei and brainstem microstructure','https://pmc.ncbi.nlm.nih.gov/articles/PMC10651583/'],
  cerebellar:['Experimental evidence for spinocerebellar pathways','https://pmc.ncbi.nlm.nih.gov/articles/PMC8805613/'],
  pelvic:['Hardy and Korstanje · lower urinary tract circuits','https://pmc.ncbi.nlm.nih.gov/articles/PMC10726905/'],
  gut:['Sun and colleagues · nerves in mouse, rhesus macaque and human colon','https://pmc.ncbi.nlm.nih.gov/articles/PMC8310542/'],
  vagus:['Human vagus nerve · anatomy and imaging','https://pmc.ncbi.nlm.nih.gov/articles/PMC12633527/'],
  carotid:['Human carotid sinus nerve anatomy','https://pmc.ncbi.nlm.nih.gov/articles/PMC10714086/'],
  motor:['OpenStax · corticospinal pathway','https://commons.wikimedia.org/wiki/File:1426_Corticospinal_Pathway.jpg'],
  autonomic:['OpenStax · sympathetic pathways','https://commons.wikimedia.org/wiki/File:1501_Connections_of_the_Sympathetic_Nervous_System.jpg'],
  insula:['Dziedzic and colleagues · human insula dissection','https://doi.org/10.1007/s10143-021-01602-5'],
  m1:['Gordon and colleagues · movement-task maps','https://doi.org/10.1038/s41586-023-05964-2'],
  s1:['Willoughby and colleagues · human tactile-task maps','https://doi.org/10.3389/fnins.2020.598482'],
  medulla:['Emmi and colleagues · human medullary nuclei reconstructed from sections','https://doi.org/10.3389/fnana.2021.663399']
};
export const brain = {
  medial:['Medial left hemisphere','Medial','', 'The surface that faces the other hemisphere is turned towards you. At this starting angle, the front is on your right and the back on your left. The diagonal is a reading direction across distributed circuits.','allen'],
  motor:['Motor cortex landmark','Lateral',12114,'Find the precentral gyrus in front of the central sulcus. Its atlas parcel is a landmark for primary motor cortex (M1). Functional and microscopic boundaries vary within the fold.','m1'],
  sensory:['Sensory cortex landmark','Lateral',12132,'Find the postcentral gyrus behind the central sulcus. It carries primary somatosensory cortex (S1). The fold separates it from the precentral gyrus. The sulcus has no separate mesh here.','s1'],
  leg:['Medial sensorimotor cortex','Medial',12126,'The rostral paracentral lobule continues the motor-side landmark onto the medial wall. The caudal part lies across the medial end of the central sulcus.','m1'],
  vpl:['Thalamic body relay · VPL','Deep',10424,'The ventral posterolateral nucleus relays body sensation on the way to cortex. VPM is a neighbouring thalamic relay for the face. Compare their source boundaries in the full atlas controls.','allen'],
  cerebellum:['Cerebellar hemisphere','Lateral',12390,'The cerebellum receives information about how limbs are moving. The atlas parcel marks the lateral cerebellar hemisphere; it cannot identify a particular sensory fibre or active cell.','cerebellar'],
  insula:['Insula under the opercula','InsulaDissection',12178,'The short insular gyri sit beneath the overlying cortex. This dissection hides the combined cerebral surface to expose five source parcels. Human insular activity can depend on the task and organ.','insula'],
  cingulate:['Anterior cingulate landmark','Medial',12157,'The rostral cingulate gyrus lies on the medial wall above the corpus callosum. It participates in coordinating bodily state, effort and action. The parcel is anatomical.','allen'],
  hypothalamus:['Hypothalamus','Medial',10467,'The hypothalamus helps coordinate bodily state and autonomic output. The selected atlas label gives a regional outline. Its individual nuclei require a finer atlas.','allen'],
  midbrain:['Midbrain tegmentum','Medial',12195,'This broad region orients the midbrain. Switch to brainstem sections to see the grey matter around the aqueduct in a different human donor.','stem'],
  medulla:['Medullary tegmentum','Medial',12538,'The medullary tegmentum provides anatomical context. The boundaries of the solitary and vagal motor nuclei are visible on separate histological sections.','medulla']
};
export const organs={
  all:['Cord and organs','Four sets of surfaces keep their positions in the female HRA reference body. Select one to examine its shape. The Allen brain and the donor sections use different coordinate systems.'],
  cord:['Spinal cord','The spinal cord is divided into its source-labelled segments. These outer shapes do not resolve horns, motor pools or individual connections. The spinal sections below show the finer anatomy.'],
  heart:['Heart','The heart receives sympathetic and vagal motor output. Pressure sensors in the carotid sinus and aortic arch send information back to the medulla. The heart geometry locates the target.'],
  bladder:['Urinary bladder','Filling stretches the wall. Pelvic afferents report this change to sacral circuits. The external urethral sphincter is a separate skeletal muscle.'],
  colon:['Colon','Networks within the gut wall coordinate local responses. The outer organ shape sets their location; a microscopic plexus requires a separate tissue preparation.']
};
const stop=(name,kind,where,text,source)=>({name,kind,where,text,source});
export const routes = {
  muscle:{title:'Muscle sensation to cortex',family:'Somatic sensory',stops:[
    stop('Muscle spindle and tendon organ','Receptors','plate:receptors','A spindle responds to muscle length and its change. A Golgi tendon organ responds to tension. Both send signals towards the spinal cord.','columns'),
    stop('Dorsal root and spinal cord','Sensory entry','body:cord','Large sensory fibres enter through dorsal roots. One branch ascends on the same side in the dorsal columns. Others reach spinal reflex circuits or cerebellar pathways.','columns'),
    stop('Gracile and cuneate nuclei','Relays','stem:medulla','Ascending fibres from the lower body reach the gracile nucleus; upper-body fibres reach the cuneate nucleus. Relay axons cross in the medulla and ascend in the medial lemniscus. Use this section to orient the medulla.','columns'),
    stop('Ventral posterolateral thalamus','Relay','brain:vpl','The medial lemniscus brings body signals to VPL on the side opposite their origin.','columns'),
    stop('Somatosensory cortex','Cortical target','brain:sensory','Thalamic relays reach sensory cortex behind the central sulcus. This is one route by which a changing limb position becomes available for perception.','s1')]},
  reflex:{title:'Stretch reflex and coordination',family:'Somatic sensory',stops:[
    stop('Stretch in a muscle','Receptor','plate:spindle','Stretch changes firing in a muscle spindle. Its sensory axon sends branches to different destinations.','columns'),
    stop('Local stretch reflex','Spinal integration','plate:cord','A spindle Ia afferent can excite a motor neuron of the same muscle. Local interneurons also regulate opposing muscles. This response does not require a trip to cortex.','motor'),
    stop('Spinocerebellar routes','Parallel sensory branch','body:cord','Another branch informs coordination. For the lower limb, spinal relay neurons in Clarke’s column send input via the dorsal spinocerebellar tract, mainly to the same-side cerebellum. Upper-limb routes differ.','cerebellar'),
    stop('Cerebellum','Coordination','brain:cerebellum','These inputs help the cerebellum compare and adjust ongoing movement. Tract-tracing evidence in other mammals and human atlas landmarks answer different parts of that question.','cerebellar')]},
  visceral:{title:'Organ sensation to forebrain',family:'Visceral sensory',stops:[
    stop('Arterial stretch','Receptor','body:heart','The carotid sinus and aortic arch contain stretch-sensitive endings. They respond to changes in arterial pressure.','carotid'),
    stop('Cranial nerves IX and X','Sensory entry','stem:medulla','Carotid sinus signals travel through the glossopharyngeal nerve (IX). Aortic baroreceptor signals travel through the vagus (X). Both reach the nucleus of the solitary tract.','carotid'),
    stop('Nucleus of the solitary tract','Sensory relay','stem:medulla','The solitary nucleus receives visceral input. It provides input both to short brainstem reflexes and to ascending networks. The nearby dorsal vagal motor nucleus sends output in the other direction.','medulla'),
    stop('Parabrachial region','Ascending relay','stem:pbn','Parabrachial pathways link brainstem bodily signals with hypothalamic, limbic and thalamic circuits. The exact relay chain depends on signal, species and task.','stem'),
    stop('Insular and cingulate networks','Forebrain integration','brain:insula','Insular and cingulate regions participate in representing bodily state and selecting responses. The shape on screen locates an anatomical landmark. Human imaging and lesion evidence relate these networks to sensation.','sensation')]},
  skeletal:{title:'Cortex to skeletal muscle',family:'Somatic motor',stops:[
    stop('Primary motor cortex','Motor origin','brain:motor','Motor cortical neurons contribute to descending commands for skilled movement. Other cortical and brainstem areas contribute too.','m1'),
    stop('Corticospinal pathway','Descending tract','plate:corticospinal','Fibres pass through the internal capsule and brainstem. Most cross in the lower medulla before descending in the lateral corticospinal tract.','motor'),
    stop('Ventral horn and ventral root','Motor pool','plate:cord','Descending signals recruit spinal interneurons and lower motor neurons. The motor axon leaves through a ventral root and travels in a peripheral nerve.','motor'),
    stop('Skeletal muscle','Effector','plate:corticospinal','The lower motor axon reaches skeletal muscle. A neuromuscular junction passes the command to the muscle fibre, which can contract and generate new sensory input. The plate shows the route to muscle; junction microstructure is outside this drawing.','motor')]},
  autonomic:{title:'Central commands to organs',family:'Autonomic motor',stops:[
    stop('Hypothalamus and brainstem','Central control','brain:hypothalamus','Hypothalamic and brainstem networks adjust autonomic output. Different organs recruit different routes.','autonomic'),
    stop('Thoracolumbar spinal cord','Sympathetic branch','body:cord','Sympathetic preganglionic neurons in the thoracolumbar cord project to ganglia. Postganglionic neurons reach targets including the heart and blood vessels.','autonomic'),
    stop('Vagal motor nuclei','Parallel parasympathetic branch','stem:medulla','Parasympathetic motor cells in nucleus ambiguus contribute strongly to cardiac vagal control. The dorsal motor nucleus of the vagus supplies many thoracic and abdominal targets, especially the gut.','medulla'),
    stop('Ganglia near the target','Peripheral relay','body:heart','Vagal preganglionic fibres reach ganglia near or within an organ. Here the target is the heart. The sympathetic and parasympathetic paths above are alternatives.','vagus')]},
  exercise:{title:'Exercise and arterial pressure',family:'Integration',stops:[
    stop('Working skeletal muscle','Sensory origin','plate:receptors','Mechanical and metabolic changes during contraction can activate thin group III and IV muscle afferents. These differ from the large spindle and tendon-organ fibres. The plate shows a spindle and a tendon organ. It does not show the group III/IV endings discussed at this stop.','exercise'),
    stop('Spinal dorsal horn','Spinal integration','plate:cord','Muscle afferents enter the dorsal horn. Ascending, multisynaptic pathways influence cardiovascular centres. Central motor command also contributes during exercise.','exercise'),
    stop('Medullary control','Brainstem integration','stem:medulla','Medullary networks alter sympathetic and vagal drive to match cardiovascular demands. No single identified human fibre in this viewer spans the whole exercise response.','exercise'),
    stop('Heart and vessels','Motor targets','body:heart','Changes in heart rate, contractility and vascular tone influence arterial pressure. This mechanical change closes the loop through arterial stretch receptors.','exercise'),
    stop('Carotid and aortic feedback','Visceral sensory return','stem:medulla','Carotid sinus input runs via IX and aortic arch input via X to the solitary nucleus. It can shape medullary output again as the body continues moving.','carotid')]},
  pelvis:{title:'Bladder filling and emptying',family:'Integration',stops:[
    stop('Bladder wall stretch','Visceral receptor','body:bladder','Filling increases tension in the bladder wall and recruits sensory endings. Pelvic afferents carry signals to the sacral cord.','pelvic'),
    stop('Sacral cord','Spinal integration','body:cord','Spinal storage reflexes help recruit pudendal motor neurons to the skeletal external sphincter. Sympathetic pathways also support storage.','pelvic'),
    stop('PAG and pontine circuits','Brainstem integration','stem:pag','The periaqueductal gray exchanges signals about bladder state with forebrain and pontine networks that coordinate voiding. The section shows the midbrain landmark.','voiding'),
    stop('Bladder and external sphincter','Distinct motor targets','body:bladder','Sacral parasympathetic output through pelvic nerves supports detrusor contraction. Coordinated reduction in pudendal somatic motor drive lets the external sphincter relax.','pelvic')]},
  gut:{title:'A local gut reflex',family:'Integration',stops:[
    stop('Stretch in the bowel wall','Sensory origin','body:colon','Distension can activate local enteric sensory circuits. Sensory fibres reaching the spinal cord or brainstem also carry information from the bowel.','gut'),
    stop('Enteric plexuses','Local integration','plate:enteric','The myenteric plexus lies between muscle layers. The submucosal plexus is closer to the lining. Local sensory neurons, interneurons and motor neurons can coordinate movement or secretion.','gut'),
    stop('Smooth muscle and mucosa','Local motor targets','body:colon','An isolated guinea-pig colon can contract in response to distension. This experiment shows a local reflex; the shape on screen comes from human anatomy.','bowelreflex'),
    stop('Extrinsic modulation','Autonomic branch','stem:medulla','Vagal supply reaches much of the proximal bowel; the distal colon also receives sacral parasympathetic input. Sympathetic and spinal sensory routes add further links.','vagus')]}
};
routes.forebrain={title:'Body state and selecting a response',family:'Integration',stops:[
  stop('Visceral input','Sensory entry','stem:medulla','Arterial and other visceral afferents enter brainstem networks. Muscle and skin signals also reach forebrain circuits through somatosensory pathways. These streams have different origins.','medulla'),
  stop('Insular cortex','Forebrain integration','brain:insula','The insula participates in representing internal bodily state alongside somatic and task information. The evidence includes heartbeat-task imaging in people. The anatomical view identifies the folds; a feeling of the heart beating requires other evidence.','heartbeat'),
  stop('Cingulate cortex','Forebrain integration','brain:cingulate','Human heartbeat-task imaging implicates insular and cingulate regions. These areas participate in attending to the body as part of wider networks. The selected parcel outlines a gyrus in another brain.','heartbeat'),
  stop('Hypothalamus and descending control','Central output','brain:hypothalamus','Hypothalamic and brainstem outputs can adjust autonomic state while cortical and spinal motor circuits recruit skeletal muscle. Their effects alter the next sensory input.','autonomic')]};
