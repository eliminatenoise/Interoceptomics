"""Reading order, anatomy, and source-specific interpretation for the field atlas."""

SITE = "model:"
ALLEN = "https://download.alleninstitute.org/informatics-archive/allen_human_reference_atlas_3d_2020/version_1/"
HRA = "https://doi.org/10.48539/HBM637.DWBM.744"
STEM = "https://doi.org/10.3389/fnana.2021.627656"
LIC = "https://creativecommons.org/licenses/by/4.0/"
GLOSSARY = "39 · SHA-256 2dfd29ae05c509025bd5c1a74a940a2a933b78c6c44fe2f94030d6fb69709741"

# A field guide is linear; the biology has branches. Links enter the corresponding
# directions and portable fragment for the actual named state in the companion.
def brain(name):
    return SITE + "#scene=brain&landmark=" + name

def stem(name):
    return SITE + "#scene=stem&plate=" + name

def body(name):
    return SITE + "#scene=body&organ=" + name

def route(name, step=0):
    return SITE + f"#route={name}&step={step}"

PLATES = {
    "spindle": ("Two spindles in a thumb muscle", "Human · transverse section of opponens pollicis",
        "Inside the shared outer capsule, separate bundles of intrafusal fibres sit side by side. The arrowheads mark them. A spindle responds to muscle length and its rate of change. The scale bar is 100 μm."),
    "receptors": ("Length and force have different sensors", "Mouse · receptor drawings and labelled tissue",
        "Read panel a, then d. Group Ia and II sensory fibres end in spindles. Group Ib fibres end in Golgi tendon organs, where muscle tension loads the tendon. The images identify endings in mice; they do not record their firing."),
    "cord": ("Where spinal sensory and motor circuits meet", "Adult human lumbar enlargement · lamina maps and tissue sections",
        "Panels E–J locate cell groups by depth in the dorsal and ventral horns. Incoming sensory fibres enter through dorsal roots. A stretch-sensitive Ia fibre can excite the same muscle’s motor pool; local interneurons help adjust activity in the opposing muscle. Cell markers alone cannot demonstrate that reflex."),
    "corticospinal": ("From cortex to skeletal muscle", "Human teaching diagram · no individual specimen",
        "Axons descend from motor cortex through the internal capsule and brainstem. Most cross at the medullary pyramids. Signals reach spinal interneurons and lower motor neurons. Their axons leave by a ventral root and reach skeletal muscle at the neuromuscular junction."),
    "motor": ("The cortex in front of the central sulcus", "Human fMRI · left precentral gyrus, surface views",
        "In Gordon and colleagues’ exemplar participant, panel a starts at six locations along the gyrus. Panel b relates movement of the foot, hand and mouth to cortical responses. These signals depend on the task. The model highlights the source gyrus as a landmark."),
    "s1": ("The cortex behind the central sulcus", "Human tactile-task fMRI · flattened surfaces",
        "Follow the dotted central sulcus across each participant’s map. The distribution behind it changes with the part of the body stimulated. Flattening exposes tissue folded into the sulcus; use the intact hemisphere to recover its shape."),
    "mida": ("Basal ganglia beside the internal capsule", "MIDA · one 29-year-old woman · coronal MRI series",
        "Read a through i from front to back. Follow the internal capsule (3) between caudate or thalamus medially and putamen or pallidum laterally. Descending axons pass through the capsule. Nearby basal-ganglia circuits help select actions through other loops."),
    "thalamus": ("The thalamic relay for the body", "MIDA · same volunteer · three planes and a 3D view",
        "Panels a–c show axial, coronal and sagittal views. These nuclei were projected from the digitized Morel atlas onto the MIDA subject. In the Allen model, VPL is the ventral posterolateral nucleus, a relay for the opposite side of the body. VPM, its neighbour, relays face sensation."),
    "cerebellum": ("The cerebellum receives a parallel account", "Human MRI · one young adult male · surfaces and flat maps",
        "Match a coloured lobule on an unfolded map to its folded surface. Lower-limb sensory information can reach Clarke’s column in the spinal cord and then the cerebellum through the mainly same-side dorsal spinocerebellar tract. Upper-limb routes differ. The map locates lobules; it does not trace those fibres."),
    "insula": ("The insula lies under the opercula", "Human donor anatomy · lateral exposure and coronal slice",
        "The overlying frontal, parietal and temporal folds hide the insula in an intact lateral view. Compare the exposed surface with the coronal specimen. The model’s insula view removes the combined outer surface, a broader exposure than the dissection."),
    "cingulate": ("The cingulate curves around the callosum", "Human MRI · medial surface · 47 adult participants",
        "Start above the corpus callosum and follow the curve forward. The colours mark divisions inferred from functional connectivity. Cingulate networks can link bodily demands with effort and action selection. A border defined by connectivity can differ from a gyrus on a structural atlas."),
    "amygdala": ("The amygdala in the anterior temporal lobe", "Human MRI · 0.6-mm in vivo segmentation · 3D view",
        "Locate the amygdala in front of the hippocampus. The stria terminalis curves towards the bed nucleus; the neighbouring fornix follows another route. This structural view leaves the amygdalofugal pathway unresolved. It cannot identify a particular emotion."),
    "hypothalamus3d": ("The hypothalamus contains many nuclei", "Human group MRI template · assembled and expanded 3D views",
        "Match PA, the paraventricular nucleus, in the upper assembly and the expanded view below. The authors used 1,000 Human Connectome Project datasets. Compare the assembled nuclei with the Allen coronal cut on the next page. Fine borders from this group atlas have not been fitted to the Allen label."),
    "pag": ("Grey matter around the cerebral aqueduct", "Coulombe · right hemi-brainstem · plate 5, +8.23 mm",
        "Find PAG around the aqueduct in this section through the midbrain. Adjacent cell-body and myelin stains reveal different boundaries. The periaqueductal grey participates in descending control and in circuits linking bladder filling to voiding."),
    "pbn": ("Parabrachial nuclei at the upper pons", "Coulombe · right hemi-brainstem · plate F, −5.91 mm",
        "Use the superior cerebellar peduncle as the landmark. MPB and LPB label medial and lateral parabrachial nuclei. Their ascending connections offer several routes from visceral brainstem signals to forebrain targets. The exact relay depends on the signal and species."),
    "medulla": ("Sensory and motor nuclei in one medullary section", "Coulombe · right hemi-brainstem · plate 37, −35.87 mm",
        "Sol marks the solitary nucleus, with its tract nearby. The dorsal motor vagal nucleus supplies parasympathetic output, especially to abdominal organs. Nucleus ambiguus lies farther laterally and contains cardiac vagal motor neurons as well as branchial motor neurons."),
    "emmi5": ("What lies beneath the floor of the fourth ventricle?", "Human donor histology · reconstruction seen from behind",
        "In this reconstruction blue identifies the solitary tract and nucleus. Violet marks the dorsal vagal motor nucleus. Both project beneath the vagal trigone; that surface landmark alone cannot tell them apart. This reconstruction comes from a different study than the adjacent sections."),
    "bridge": ("Working muscle changes cardiovascular drive", "Review schematic · exercise pressor reflex in heart failure",
        "The left side follows sensory input from muscle; the right side follows autonomic output. The circled numbers mark sites discussed specifically in heart failure. In a separate cycling experiment with five men, partly attenuating lower-limb sensory input reduced the cardiovascular response to the same workloads. That result supports a contribution from muscle feedback. It cannot identify each relay in the drawing."),
    "symp": ("Sympathetic outflow", "Human teaching diagram · thoracolumbar outflow",
        "Preganglionic neurons in the thoracic and upper lumbar cord send axons to sympathetic ganglia. Postganglionic neurons then reach targets including heart and vessels. Cardiac drive and patterns of vascular tone can change on a different timetable from the movement itself."),
    "parasymp": ("Parasympathetic outflow", "Human teaching diagram · cranial and sacral routes",
        "From brainstem or sacral cord, preganglionic fibres reach ganglia near or within their targets. Cardiac vagal motor fibres strongly influence heart rate. Sacral parasympathetic fibres reach the pelvic organs by a different route."),
    "bladdertissue": ("Sacral branches reaching the bladder", "Human donor pelvis · medial dissection and micro-CT",
        "The authors follow an S3 contribution in this specimen. Panel A looks laterally from the midline; D follows a removed tissue block lengthwise, and E–F cut across vesical branches. Other specimens in this study had different root contributions. Fibre direction and signalling require other experiments."),
    "enterictissue": ("The nervous system within the colon wall", "Mouse A–C · macaque D · adult human E–F · light-sheet imaging",
        "Read human panels E and F as cross-sectional projections through labelled tissue. E spans 2 mm of tissue; F spans 1 mm of mucosa. In the muscle wall, the myenteric plexus lies between longitudinal and circular muscle. The submucosal plexus lies closer to the lining. Labels locate nerve elements without recording a reflex."),
}

SECTIONS = [
    ("receptors","Muscle and tendon","How does a muscle sense a change?","A lengthening muscle and a tightening tendon load different endings. This is one part of myoception, the programme’s name for sensation associated with muscle-driven movement, including task-relevant touch.","spindle receptors",("Trace muscle sensation",route("muscle"))),
    ("cord","Spinal cord","One input has several destinations","Some fibres branch into a local reflex. Others ascend towards conscious limb-position sense or supply cerebellar circuits that help adjust a movement already under way.","cord",("Trace the reflex and cerebellar branch",route("reflex",1))),
    ("motorpath","Somatic motor","A motor command leaves the spinal cord","Follow the descending pathway to the ventral horn. The final motor axon reaches skeletal muscle, where its effect changes the length and force that muscle sensors report.","corticospinal",("Follow the descending command",route("skeletal",1))),
    ("cortex","Sensorimotor cortex","Find the fold between sensing and acting","The central sulcus separates the precentral and postcentral gyri. Their medial continuations include leg territories. Compare each experiment with the folded structural surface in the model.","motor s1",("Locate the precentral gyrus",brain("motor"))),
    ("thalamus","Deep forebrain","The route crosses before it reaches the thalamus","Large-fibre input from the lower and upper body ascends in the dorsal columns to the gracile and cuneate nuclei. Axons from those nuclei cross in the medulla and ascend in the medial lemniscus to VPL. Thalamic neurons project onwards to somatosensory cortex.","mida thalamus",("Isolate VPL in the brain",brain("vpl"))),
    ("cerebellum","Parallel somatic pathways","Movement also needs feedback before we feel it","A local stretch reflex, a cerebellar update and a conscious estimate of limb position can draw on the same movement. Each has a different destination and a different number of relays.","cerebellum",("Locate the cerebellar hemisphere",brain("cerebellum"))),
    ("insular","Forebrain integration","How does bodily state enter a decision?","Imagine keeping pace uphill. Changing muscle and cardiovascular signals reach forebrain networks by several routes. An insular response can depend on the organ, effort and task. Cingulate and related networks participate in choosing whether to keep going.","insula cingulate",("Expose the insula",brain("insula"))),
    ("hypothalamus","Forebrain integration","Bodily demand can change the next action","The amygdala, cingulate and hypothalamus contribute to overlapping circuits that couple context with action and autonomic output. The evidence here locates structures; no plate records the runner’s decision.","amygdala hypothalamus3d",("Locate the hypothalamic territory",brain("hypothalamus"))),
    ("midbrain","Midbrain section","Find the aqueduct, then the surrounding grey","The source sections run parallel to the junction of pons and midbrain. Distances are measured along the donor atlas reference, with positive values above the junction and negative values below it.","pag",("Open the midbrain section",stem("pag"))),
    ("pons","Upper pons section","Find the peduncle, then the parabrachial nuclei","This plate pairs a choline acetyltransferase stain with a myelin stain. Its printed scale bar and junction-relative level belong to this donor. Dashed boundaries mark regions the original authors could not sharply delineate.","pbn",("Open the upper pons section",stem("pbn"))),
    ("medullary","Medulla section","One nerve carries traffic in both directions","Follow the carotid and aortic sensory return to the solitary nucleus. Then locate the motor nuclei nearby. Their axons leave the brainstem to affect organs. Proximity on the page gives no direction of travel by itself.","medulla",("Open the medullary section",stem("medulla"))),
    ("medullary3d","Medullary reconstruction","The vagal trigone covers more than one nucleus","The floor of the fourth ventricle gives the reader a surface landmark. Independent reconstructions from donor sections help interpret what lies below that surface.","emmi5",("Compare the medullary section",stem("medulla"))),
    ("exercise","Exercise feedback","A working leg can change the next heartbeat","Group III and IV muscle afferents respond to mechanical and metabolic changes. They enter the spinal dorsal horn. Multisynaptic pathways influence medullary networks alongside central motor command. The next page follows the arterial return.","bridge",("Trace the exercise loop",route("exercise"))),
    ("autonomic","Autonomic motor","Two routes from the nervous system to organs","Both routes usually have a neuron before and a neuron after a ganglion. The location of the first neuron, the ganglion and the target distinguishes the pathways.","symp parasymp",("Trace autonomic output",route("autonomic"))),
    ("pelvic","Pelvic integration","A filling bladder recruits two kinds of muscle","Stretch-sensitive pelvic afferents reach the sacral cord. During storage, spinal reflexes recruit pudendal motor neurons that tighten the striated external sphincter. During voiding, pontine circuits coordinate pelvic parasympathetic drive to detrusor smooth muscle with reduced pudendal output.","bladdertissue",("Trace filling and emptying",route("pelvis"))),
    ("enteric","Gut integration","The bowel can organize a response within its wall","Local sensory neurons, interneurons and enteric motor neurons can coordinate contractions or secretion. Extrinsic vagal, spinal sensory, sympathetic and sacral pathways link the gut to the rest of the body. Their distribution changes along the bowel.","enterictissue",("Trace the local gut reflex",route("gut"))),
]
