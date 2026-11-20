export const organs = {
  cord: {
    name: 'Spinal cord', color: '#ccad71', side: 'left', anchor: /C5_segment/,
    parts: [
      ['Cervical segments', /cervical/], ['Thoracic segments', /thoracic/],
      ['Lumbar segments', /lumbar/], ['Sacral segments S1–S4', /sacral/]
    ]
  },
  heart: {
    name: 'Heart', color: '#a95151', side: 'right', anchor: /right_ventricle$/,
    parts: [
      ['Chambers and septum', /atrium|ventricle|septum/], ['Four heart valves', /valve$/],
      ['Papillary muscles', /papillary/]
    ]
  },
  colon: {
    name: 'Colon', color: '#bc7865', side: 'left', anchor: /ascending_colon$/,
    parts: [
      ['Caecum and appendix', /caecum|appendix|ileocecal/], ['Ascending and transverse colon', /ascending|transverse|hepatic/],
      ['Descending and sigmoid colon', /descending|sigmoid|splenic/], ['Rectum', /rectum$/]
    ]
  },
  bladder: {
    name: 'Urinary bladder', color: '#748d9d', side: 'right', anchor: /fundus_of_urinary_bladder_dome/,
    parts: [
      ['Dome and base', /fundus/], ['Trigone and ureteral openings', /trigone|orifice/],
      ['Bladder neck', /neck/]
    ]
  }
};

const tints = [
  [/right_ventricle/, '#b45c51'], [/left_ventricle/, '#9f4b4e'], [/right_cardiac_atrium/, '#96617b'],
  [/left_cardiac_atrium/, '#b37577'], [/septum/, '#9f615e'], [/valve$/, '#e1c29f'], [/papillary/, '#b57968'],
  [/appendix/, '#ad695f'], [/hepatic|splenic/, '#c18a76'], [/transverse_colon/, '#c48170'],
  [/caecum/, '#c38972'], [/sigmoid/, '#a56665'], [/rectum/, '#a76c73'],
  [/trigone/, '#9dbfbe'], [/orifice/, '#b46a5d'], [/bladder_neck/, '#92819c'], [/bladder_base/, '#648596'],
  [/thoracic/, '#c4a362'], [/lumbar/, '#cba577'], [/sacral/, '#bc9365']
];

export function tint(name, key) {
  return tints.find(([match]) => match.test(name))?.[1] || organs[key].color;
}
