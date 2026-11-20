"""Build the illustrated Backslash of the Brain PDF from the public assets."""
import argparse
import hashlib
from io import BytesIO
import json
import os
from pathlib import Path
from xml.sax.saxutils import escape
from urllib.parse import parse_qs

from PIL import Image
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen.canvas import Canvas
from reportlab.platypus import Paragraph

from atlas_content import ALLEN, GLOSSARY, HRA, LIC, PLATES, SECTIONS, SITE, STEM, body, brain, route, stem

BASE = Path(__file__).resolve().parent
ASSETS = BASE / "assets"
plates = json.loads((BASE / "plates.json").read_text())
W, H = 900, 637
M = 43
INK, TEAL, SUB, RULE, PALE = map(HexColor, ["#172E34","#176569","#445F66","#C7D4D1","#F0F5F3"])
args = argparse.ArgumentParser(description=__doc__)
args.add_argument("output", type=Path)
args.add_argument("--font-dir", type=Path, required=True, help="Directory containing LiberationSans-Regular.ttf and LiberationSans-Bold.ttf")
config = args.parse_args()
for label, style in (("Sans", "Regular"), ("Bold", "Bold")):
    pdfmetrics.registerFont(TTFont(label, str(config.font_dir / f"LiberationSans-{style}.ttf")))
os.environ.setdefault("SOURCE_DATE_EPOCH", "1795176000")
c = Canvas(str(config.output),pagesize=(W,H),pageCompression=True,invariant=False,initialFontName="Sans")
c.setTitle("Backslash of the Brain | An illustrated neuroanatomy atlas")
c.setSubject("Myoception, visceroception and the circuits that link movement with organs")
c.setAuthor("Interoceptomics")
c.setCreator("Interoceptomics · public atlas edition")
c.setKeywords("neuroanatomy, myoception, visceroception, somatic, autonomic, brainstem")
coronal_url = SITE + "#scene=brain&landmark=hypothalamus&cut=central"
pages = ["start","routes","orient"]+[s[0] for s in SECTIONS[:8]]+["coronal","sections"]+[s[0] for s in SECTIONS[8:13]]+["return","autonomic","body","pelvic","enteric","find","localviews","localroutes","localloops","evidence"]
page_no = {key: i+1 for i,key in enumerate(pages)}

def line(t,x,y,size=12,bold=False,color=INK):
    c.setFont("Bold" if bold else "Sans",size)
    c.setFillColor(color)
    c.drawString(x,y,t)

def paragraph(t,x,top,w,size=13,leading=18,*,bold=False,color=INK):
    p=Paragraph(escape(t),ParagraphStyle("p",fontName="Bold" if bold else "Sans",fontSize=size,leading=leading,textColor=color))
    _,h=p.wrap(w,H)
    p.drawOn(c,x,top-h)
    return top-h

def destination(target, rect):
    if target.startswith("@"):
        c.linkRect("",target[1:],rect,thickness=0)
    elif target.startswith(SITE):
        q=parse_qs(target.partition("#")[2])
        anchor="localviews"
        if "route" in q:
            anchor="circuit-"+q["route"][0]
        elif "cut" in q:
            anchor="local-coronal"
        elif "landmark" in q or "plate" in q or "organ" in q:
            anchor="local-"+next(q[k][0] for k in ("landmark","plate","organ") if k in q)
        c.linkRect("",anchor,rect,thickness=0)
    else:
        c.linkURL(target,rect,thickness=0)

def link(label,target,x,y,size=11):
    line(label,x,y,size,True,TEAL)
    width=pdfmetrics.stringWidth(label,"Bold",size)
    rect=(x,y-3,x+width,y+size+2)
    destination(target,rect)
    return width

def hr(x,y,x2):
    c.setStrokeColor(RULE)
    c.setLineWidth(.8)
    c.line(x,y,x2,y)

def image(key,x,y,w,h,url,*,is_capture=False):
    if is_capture:
        path=ASSETS/("view-"+key+".png")
    else:
        m=plates[key]; path=ASSETS/m["file"]
        if hashlib.sha256(path.read_bytes()).hexdigest()!=m["sha256"]:
            raise ValueError(f"Unexpected figure bytes for {key}")
    with Image.open(path) as im:
        b=BytesIO()
        rgba=im.convert("RGBA")
        white=Image.new("RGB",rgba.size,"white")
        white.paste(rgba,mask=rgba.getchannel("A"))
        if im.format=="JPEG":
            src=ImageReader(str(path))
        elif is_capture:
            src=ImageReader(white)
        else:
            white.save(b,format="JPEG",quality=95,subsampling=0)
            b.seek(0)
            src=ImageReader(b)
        scale=min(w/im.width,h/im.height)
        iw,ih=im.width*scale,im.height*scale
        left,bottom=x+(w-iw)/2,y+(h-ih)/2
        c.drawImage(src,left,bottom,iw,ih)
        destination(url,(left,bottom,left+iw,bottom+ih))

def begin(key,title,tag,summary=None):
    if c.getPageNumber()!=page_no[key]:
        raise ValueError(f"Sequence mismatch at {key}")
    c.bookmarkPage(key);c.addOutlineEntry(title,key,0 if key=="start" else 1)
    line(tag.upper(),M,600,10.5,True,TEAL)
    c.setFillColor(INK)
    line(title,M,554,32 if len(title)<=47 else 29,True)
    if pdfmetrics.stringWidth(title,'Bold',32 if len(title)<=47 else 29)>W-2*M:
        raise ValueError(f"Title overflow: {title}")
    if summary:
        y=paragraph(summary,M,536,W-2*M,14.2,18.3,color=SUB)
        if y<477:raise ValueError(f"Intro overflow on {key}")
    hr(M,469,W-M)

def footer(key,nav=None):
    hr(M,48,W-M)
    link("Structure index", "@find", M,26,10)
    link("Sources & image use","@evidence",M+107,26,10)
    if nav:
        link(nav[0],nav[1],M+275,26,10.4)
    c.setFillColor(SUB);c.setFont("Sans",11);c.drawRightString(W-M,26,f"{page_no[key]} / {len(pages)}")
    c.showPage()

def cover():
    key="start"
    c.bookmarkPage(key);c.addOutlineEntry("Backslash of the Brain",key,0)
    line("INTEROCEPTOMICS",M,596,13,True,TEAL)
    line("Backslash of the Brain",M,530,55,True)
    line("An illustrated atlas of movement, organ sensation and the circuits they share",M,495,21,color=SUB)
    hr(M,471,W-M)
    image("brain",M,117,528,329,brain("medial"),is_capture=True)
    x=602
    y=paragraph("Start inside the left hemisphere.",x,442,252,20,24,bold=True)
    y=paragraph("The front faces right. The back faces left. The curved strip above the corpus callosum is cingulate cortex. The cerebellum sits behind the brainstem.",x,y-14,252,14.3,19.8)
    y=paragraph("Extract Backslash-Atlas.zip. With Python 3.10+ installed, run Linux.sh, macOS.command or Windows.cmd. The launcher prints the local address. Keep its window open.",x,y-15,252,14.3,19.8,color=SUB)
    link("Choose a pathway", "@routes",x,y-24,13)
    link("Find a view in the offline model","@localviews",x,y-48,13)
    line("Medial model view · Song-Lin Ding and Allen Institute for Brain Science, Allen Human Reference Atlas – 3D (2020), v1.0.0.",M,95,10.4)
    link("Original atlas",ALLEN,M,76,10);link("CC BY 4.0",LIC,M+82,76,10)
    footer(key,("Offline model directions","@localviews"))

def routes_page():
    key="routes"
    begin(key,"Which way does the signal travel?","Four ways through the nervous system","To try a route, extract Backslash-Atlas.zip and run Linux.sh, macOS.command or Windows.cmd with Python 3.10+. Open the address printed by the launcher. Select Follow a circuit. The rows below link to the names of its stops.")
    items=[
        ("Somatic sensory","Muscle or tendon receptor","Dorsal root, cord, medulla","VPL thalamus and sensory cortex","muscle"),
        ("Visceral sensory","Arterial stretch receptor","Cranial nerve IX or X","Solitary nucleus in the medulla","visceral"),
        ("Somatic motor","Motor cortex","Corticospinal tract, spinal motor pool","Ventral root to skeletal muscle","skeletal"),
        ("Autonomic motor","Brainstem or spinal preganglionic cell","Autonomic ganglion","Postganglionic fibre to an organ","autonomic")]
    for i,(kind,a,b,d,r) in enumerate(items):
        y=435-68*i
        link(kind,route(r),M,y,14)
        for x,s in [(200,a),(397,b),(624,d)]:
            paragraph(s,x,y+12,177,13,16)
        line("→",375,y,18,True,TEAL);line("→",600,y,18,True,TEAL)
        hr(M,y-32,W-M)
    y=paragraph("Myoception includes proprioception, touch and other task-relevant feedback from muscle-driven movement. Visceroception means sensing conditions inside an organ, such as the stretch of a filling bladder.",M,163,W-2*M,14.3,20)
    line("Follow the integration",M,96,13,True)
    for x,(t,k) in zip((205,381,545,693),[("Spinal stretch reflex","reflex"),("Exercise","exercise"),("Pelvis","pelvis"),("Gut wall","gut")]):
        link(t,route(k),x,96,12)
    footer(key,("Visit the medial surface",brain("medial")))

def orientation():
    key="orient"
    begin(key,"Three views of the same left hemisphere","The brain model","A medial view cannot expose every structure. Move the camera to see the lateral folds, remove the outer surface to find the insula, or inspect a deep thalamic relay.")
    names=[("lateral","Motor landmark","The highlighted precentral gyrus lies anterior to the central sulcus. The postcentral gyrus starts on its other side.",brain("motor")),
           ("insula","Insular dissection","The source-labelled short insular gyri are buried in the lateral sulcus. The other visible parcels remain in the same reference frame.",brain("insula")),
           ("vpl","VPL thalamic relay","The camera isolates the source-left VPL nucleus. Its shape comes from the source mask. Compare VPL with neighbouring VPM in the full atlas controls.",brain("vpl"))]
    for i,(k,title,desc,u) in enumerate(names):
        x=M+278*i;image(k,x,241,258,205,u,is_capture=True)
        link(title,u,x,215,15);paragraph(desc,x,195,251,13.5,18.8)
    paragraph("All three captures come from the 0.5-mm Allen annotation of a symmetric population-average MRI template. The colours identify selected anatomical associations. The resting or moving brain of an individual would require a separate measurement.",M,112,W-2*M,12.7,17,color=SUB)
    footer(key,("Find Full brain controls","@localviews"))

def section(s):
    key,group,title,intro,ids,nav=s; keys=ids.split()
    begin(key,title,group,intro)
    if len(keys)==2:
        for i,k in enumerate(keys):
            x=M+i*418;w=396; t,mode,caption=PLATES[k];m=plates[k]
            y=paragraph(t,x,454,w,16,19,bold=True)
            paragraph(mode,x,y-5,w,11.1,14,color=SUB)
            image(k,x,173,w,211,m["source"])
            bottom=paragraph(caption,x,161,w,12.3,16.4)
            if bottom<74:raise ValueError(f"Caption too long: {k} {bottom}")
            link(m["credit"],m["source"],x,67,9.7);link(m["license"],m["license_url"],x,55,9.1)
    else:
        k=keys[0];t,mode,caption=PLATES[k];m=plates[k]
        image(k,M,61,493,392,m["source"])
        x=559;w=W-M-x
        y=paragraph(t,x,440,w,21,24.7,bold=True)
        y=paragraph(mode,x,y-13,w,12.4,16.8,color=TEAL)
        y=paragraph(caption,x,y-19,w,14.4,20)
        y=paragraph(m["credit"],x,y-17,w,11.4,15.6,color=SUB)
        link("Open original figure",m["source"],x,y-17,10.8)
        link(m["license"],m["license_url"],x,y-38,10.4)
        if "article" in m: link("Original atlas article",m["article"],x+100,y-38,10.4)
        if y-38<54:raise ValueError(f"Single plate overflow: {k}")
    footer(key,nav)

def source_view(key,title,tag,intro,capture,where,details,source,credit):
    begin(key,title,tag,intro)
    image(capture,M,95,510,340,where,is_capture=True)
    x=580; y=442
    for heading,explanation in details:
        y=paragraph(heading,x,y,274,16.5,20,bold=True)
        y=paragraph(explanation,x,y-7,274,13.3,17.5)-17
    if y<68:raise ValueError(f"Model-page overflow at {key}")
    paragraph(credit,M,87,500,10.2,12,color=SUB)
    footer(key,("Find this view in the offline model",where))

def pressure():
    key="return"
    begin(key,"How pressure comes back to the brain","Exercise feedback","An artery stretches as pressure rises. Two sets of sensory endings report that stretch to the medulla. The response adjusts outgoing cardiac and vascular drive while the muscle continues working.")
    def rect(x,y,w,h,title,desc):
        c.setFillColor(PALE);c.roundRect(x,y,w,h,7,stroke=0,fill=1)
        yy=paragraph(title,x+13,y+h-13,w-26,15.5,18,bold=True)
        paragraph(desc,x+13,yy-7,w-26,12.7,16.6)
    def arrow(x1,y1,x2,y2):
        import math
        c.setStrokeColor(TEAL);c.setLineWidth(2);c.line(x1,y1,x2,y2)
        theta=math.atan2(y2-y1,x2-x1)
        for d in (-.5,.5):c.line(x2,y2,x2-8*math.cos(theta+d),y2-8*math.sin(theta+d))
    rect(M,334,220,92,"Carotid sinus","Stretch → carotid sinus nerve → glossopharyngeal nerve (IX).")
    rect(M,211,220,92,"Aortic arch","Stretch → aortic afferents in the vagus nerve (X).")
    rect(335,268,195,109,"Solitary nucleus","Visceral sensory relay in the medulla. Both arterial inputs reach this region.")
    rect(606,265,250,119,"Medullary output circuits","A rise in pressure can increase cardiac vagal drive and inhibit sympathetic drive to the heart and vessels.")
    arrow(268,378,328,338);arrow(268,255,328,302);arrow(535,323,599,323)
    y=paragraph("During exercise, descending motor command and group III/IV muscle feedback also influence medullary circuits. The baroreflex can operate around a shifted pressure range. It continues to respond to changes in arterial stretch.",M,185,W-2*M,14.4,19.3)
    link("Human exercise measurements", "https://pmc.ncbi.nlm.nih.gov/articles/PMC2963332/",M,y-24,11)
    link("Carotid sinus nerve dissection", "https://pmc.ncbi.nlm.nih.gov/articles/PMC10714086/#F2",M+230,y-24,11)
    link("Original baroreflex teaching figure", "https://www.ncbi.nlm.nih.gov/sites/books/NBK537223/figure/article-18975.image.f1/",M+455,y-24,11)
    footer(key,("Follow the returning input",route("exercise",4)))

def index():
    key="find"
    begin(key,"Find a structure or return to a circuit","Structure-to-view index","Select the page number for the anatomical evidence. Select the model entry for its in-app controls and local-address fragment. Extract Backslash-Atlas.zip, then run Linux.sh, macOS.command or Windows.cmd with Python 3.10+.")
    items=[
        ("Muscle spindle · tendon organ","receptors",route("muscle"),"Tissue plate"),
        ("Dorsal root · spinal horns","cord",route("reflex",1),"Spinal section"),
        ("Motor tract · skeletal muscle","motorpath",route("skeletal",1),"Motor route"),
        ("Central sulcus · motor and sensory gyri","cortex",brain("sensory"),"Lateral brain"),
        ("VPL · VPM · internal capsule","thalamus",brain("vpl"),"Deep brain"),
        ("Cerebellum · spinocerebellar branch","cerebellum",route("reflex",3),"Cerebellum"),
        ("Insula · cingulate","insular",route("forebrain",1),"Forebrain route"),
        ("Amygdala · hypothalamic nuclei","hypothalamus",coronal_url,"Hypothalamic section"),
        ("Periaqueductal grey","midbrain",stem("pag"),"Section +8.23 mm"),
        ("Parabrachial nuclei","pons",stem("pbn"),"Section −5.91 mm"),
        ("Solitary · dorsal vagal motor · ambiguus","medullary",stem("medulla"),"Section −35.87 mm"),
        ("Cardiac exercise reflex · arterial pressure","return",route("exercise",2),"Exercise loop"),
        ("Sympathetic · parasympathetic ganglia","autonomic",route("autonomic",1),"Autonomic route"),
        ("Cord · heart · bladder · colon","body",body("all"),"Cord & organs"),
        ("Bladder · sphincter · pelvic nerve","pelvic",route("pelvis"),"Pelvic route"),
        ("Enteric plexuses · gut wall","enteric",route("gut",1),"Colon tissue")]
    for i,(label,k,u,anchor) in enumerate(items):
        col,row=divmod(i,8);x=M+col*416;y=434-row*46
        line(label,x,y,12.15,True)
        link(f"p. {page_no[k]:02d}","@"+k,x,y-16,10.8)
        link(anchor,u,x+52,y-16,10.8);hr(x,y-25,x+391)
    footer(key,("Start the offline model","@localviews"))

def local_views():
    key="localviews"
    begin(key,"Open a view on your own computer","Offline companion",
        "Extract Backslash-Atlas.zip in full. With Python 3.10+ available, run Linux.sh on Linux, macOS.command on macOS or Windows.cmd on Windows. Leave the launcher running. If the browser does not open, copy the printed address into it.")
    line("Choose the tab, then the named option",M,442,15,True)
    paragraph("Or remove any existing # fragment from the printed local address and append the text below. The port can change each time the launcher starts.",M,426,W-2*M,12,16)
    controls=json.loads((BASE/"controls.json").read_text())
    items=[("Brain",v,brain(k),k) for k,v in controls["landmarks"].items() if k in ("medial","motor","sensory","vpl","cerebellum","insula","cingulate","hypothalamus")]
    items += [("Brain","Hypothalamus → Coronal section",coronal_url,"coronal"),
              ("Brainstem sections","Midbrain · around the aqueduct",stem("pag"),"pag"),
              ("Brainstem sections","Upper pons · parabrachial region",stem("pbn"),"pbn"),
              ("Brainstem sections","Medulla · solitary and vagal motor nuclei",stem("medulla"),"medulla"),
              ("Cord & organs","Cord and organs",body("all"),"all")]
    for i,(tab,label,target,k) in enumerate(items):
        col,row=divmod(i,7);x=M+col*416;y=380-row*44
        c.bookmarkHorizontalAbsolute("local-"+k,y+17)
        paragraph(tab+"  /  "+label,x,y+12,392,11.4,14,bold=True)
        line("#"+target.split("#",1)[1],x,y-16,10.5,color=TEAL)
        hr(x,y-25,x+392)
    paragraph("For the original region finder, annotation planes and camera controls, choose Full brain controls in the companion header.",M,67,W-2*M,11.5,14,color=SUB)
    footer(key,("Find a circuit","@localroutes"))

def circuit_guide(key,title,ids):
    begin(key,title,"Offline companion",
        "In the model, open Follow a circuit and select the title below. Use Next or choose a numbered stop. You can also append the printed fragment to the launcher’s local address, replacing any earlier fragment. The first stop has step=0.")
    controls=json.loads((BASE/"controls.json").read_text())["routes"]
    y=443
    for k in ids:
        name,stops=controls[k]
        c.bookmarkHorizontalAbsolute("circuit-"+k,y+16)
        line(name,M,y,15,True)
        line(f"#route={k}&step=0",573,y,11.4,color=TEAL)
        sequence="     ".join(f"{i+1}. {t}" for i,t in enumerate(stops))
        b=paragraph(sequence,M,y-11,W-2*M,12.6,16.3)
        hr(M,b-11,W-M);y=b-33
    footer(key,("Model launch instructions","@localviews"))

def evidence():
    key="evidence"
    begin(key,"Where the images and routes come from","Sources & image use","Each published plate links to its original figure or article. Credits and licence links sit next to the corresponding image. The reference frames differ; the atlas does not register them to a single person.")
    items=[
        ("Brain","Song-Lin Ding, Joshua J. Royall, Susan M. Sunkin, Benjamin A. C. Facer, Phil Lesnar, Amy Bernard, Lydia Ng and Ed S. Lein (2020). Allen Human Reference Atlas – 3D v1.0.0. © 2019 Allen Institute for Brain Science. Left labels on ICBM 2009b Nonlinear Symmetric; selected, coloured and rendered for this atlas.",ALLEN),
        ("Brainstem","V. Coulombe, S. Saikali, L. Goetz, M. A. Takech, É. Philippe, A. Parent and M. Parent (2021). Right hemi-brainstem of one 61-year-old woman. Sections parallel to the pontomesencephalic junction; check each scale bar.",STEM),
        ("Body","Kristen Browne and Heidi Schlehlein (2026). 3D Reference Organ Set for Female, v1.10. Four selected organ groups retain their HRA coordinates. The viewer supplies the display colours and camera. Source data include the National Library of Medicine Visible Human Dataset.",HRA),
        ("Reference plates","Journal figures and OpenStax illustrations retain their original labels, scales and colours. Reproductions are fitted to the page and encoded for PDF. Original typography inside a supplied image belongs to that source.","@find"),
        ("Related illustrations","Hardy and Korstanje’s bladder schematic and Hazart and colleagues’ gut-wall diagram are available at the original publications. The pelvic and colon plates in this edition show donor material.",None)]
    y=446
    for title,copy,u in items:
        if u:link(title,u,M,y,13.2)
        else:line(title,M,y,13.2,True)
        bottom=paragraph(copy,M+160,y+12,W-2*M-160,12.45,16.4);hr(M,bottom-9,W-M);y=bottom-27
    link("Original bladder schematic","https://pmc.ncbi.nlm.nih.gov/articles/PMC10726905/figure/acel13990-fig-0001/",M,100,10.6)
    link("Original gut-wall schematic","https://doi.org/10.3389/fnana.2025.1532900",M+200,100,10.6)
    link("CC BY 4.0 for all three model views",LIC,M+400,100,10.6)
    line("Programme glossary revision "+GLOSSARY,M,69,9.7,color=SUB)
    footer(key,("Return to four pathways","@routes"))

cover();routes_page();orientation()
for s in SECTIONS[:8]:section(s)
source_view("coronal","Find the hypothalamus in its source section","Coronal anatomy",
    "A coronal cut runs from one side of the head to the other. Compare the shape on this slice with the assembled and expanded hypothalamic nuclei on the preceding page. Each atlas uses its own anatomical labels.","coronal",coronal_url,
    [("Where to look","In the Allen atlas, this coronal slice is 12 mm posterior to the coordinate origin (A = −12 mm, grid index j = 244). Superior is up. The orange mask is on the source-left side."),
     ("What the colour means","At this level 98 source-left voxels carry parent label 10467 directly. Other hypothalamic tissue can have a more specific label. This sparse patch alone gives neither the full hypothalamic outline nor the borders of its nuclei.")],ALLEN,
    "Song-Lin Ding and Allen Institute for Brain Science · Human Reference Atlas – 3D, 2020 v1.0.0 · CC BY 4.0. Author-selected section and colour.")
source_view("sections","Read the brainstem one section at a time","The brainstem viewer",
    "The companion moves from the midbrain and upper pons to a sequence of three medullary sections. This capture shows the middle medullary level. Select the image to inspect it in the companion.","brainstem",stem("medulla"),
    [("Compare adjacent levels","Plate 36 lies at −34.87 mm, plate 37 at −35.87 mm and plate 38 at −36.87 mm. Follow the solitary nucleus across all three. Its outline changes with the level."),
     ("Read the stains","Cresyl violet reveals cell-body patterns. Luxol fast blue reveals myelinated fibres. These are adjacent tissue sections from the donor’s right side. The interactive brain view uses the left side of a different reference.")],STEM,
    "Coulombe et al. (2021) · Fig. 38, plate 37 · CC BY 4.0. Viewer capture includes article image and section controls.")
for s in SECTIONS[8:13]:section(s)
pressure();section(SECTIONS[13])
source_view("body","Keep the cord and organs in their own frame","The body model",
    "The heart, colon, urinary bladder and spinal cord retain their positions in the Human Reference Atlas female organ set. Select one organ in the companion to examine its surface.","body",body("all"),
    [("Locate the target","The cord, heart, colon and bladder are labelled. Each keeps its location in this female reference body. The cord extends from C1 to S4 in the selected source set."),
     ("Switch scales","The spinal cord surface cannot show a dorsal horn neuron. A colon surface cannot show a myenteric ganglion. Turn to the tissue plate for that scale. The route annotations describe physiology across these separate preparations.")],HRA,
    "Browne & Schlehlein (2026) · Human Reference Atlas, female unified set v1.10 · CC BY 4.0. Four selected surface groups, recoloured.")
section(SECTIONS[14]);section(SECTIONS[15]);index();local_views()
circuit_guide("localroutes","Follow a sensory or motor pathway",["muscle","reflex","visceral","skeletal","autonomic"])
circuit_guide("localloops","Follow a feedback loop",["exercise","pelvis","gut","forebrain"])
evidence();c.save()
