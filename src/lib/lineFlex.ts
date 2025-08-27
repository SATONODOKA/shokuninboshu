export function buildJobFlex(job: {
  trade: string; sitePref: string; siteCity: string;
  startDate: string; endDate: string; salaryBand: string; summary?: string; tel?: string;
}) {
  return {
    type: 'flex',
    altText: `新規募集: ${job.trade} @ ${job.sitePref}${job.siteCity}`,
    contents: {
      type: 'bubble',
      body: {
        type: 'box', layout: 'vertical', spacing: 'md',
        contents: [
          { type:'text', text:`【${job.trade}】${job.sitePref}${job.siteCity}`, weight:'bold', size:'md' },
          { type:'text', text:`${job.startDate}〜${job.endDate}｜${job.salaryBand}`, size:'sm', color:'#6B7280' },
          ...(job.summary ? [{ type:'text', text: job.summary, wrap:true, size:'sm' }] : []),
          { type:'separator', margin:'md' },
          { type:'box', layout:'horizontal', spacing:'sm', contents:[
            { type:'button', style:'primary', color:'#1BA3A3',
              action:{ type:'message', label:'応募する', text:'応募します' } },
            { type:'button', style:'link',
              action:{ type:'uri', label:'電話', uri: job.tel ? `tel:${job.tel}` : 'https://line.me' } }
          ]}
        ]
      }
    }
  };
}