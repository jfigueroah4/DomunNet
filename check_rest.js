const url = 'https://thpnjsfmfoxcupywisqu.supabase.co/rest/v1/proyecto?select=*&limit=1';
const headers = {
  'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRocG5qc2ZtZm94Y3VweXdpc3F1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzUyNzM5OCwiZXhwIjoyMDk5MTAzMzk4fQ.D63yLAL-1OD83m-jN1vCwZTHAImEnAbXlYGL6-MHpLQ',
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRocG5qc2ZtZm94Y3VweXdpc3F1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzUyNzM5OCwiZXhwIjoyMDk5MTAzMzk4fQ.D63yLAL-1OD83m-jN1vCwZTHAImEnAbXlYGL6-MHpLQ'
};

fetch(url, { headers })
  .then(res => res.json())
  .then(data => console.log('PROYECTO:', data.length ? Object.keys(data[0]) : 'no data'))
  .catch(console.error);

fetch('https://thpnjsfmfoxcupywisqu.supabase.co/rest/v1/proyecto_detalle?select=*&limit=1', { headers })
  .then(res => res.json())
  .then(data => console.log('PROYECTO_DETALLE:', data.length ? Object.keys(data[0]) : 'no data'))
  .catch(console.error);
