const url = 'https://thpnjsfmfoxcupywisqu.supabase.co/rest/v1';
const headers = {
  'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRocG5qc2ZtZm94Y3VweXdpc3F1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzUyNzM5OCwiZXhwIjoyMDk5MTAzMzk4fQ.D63yLAL-1OD83m-jN1vCwZTHAImEnAbXlYGL6-MHpLQ',
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRocG5qc2ZtZm94Y3VweXdpc3F1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzUyNzM5OCwiZXhwIjoyMDk5MTAzMzk4fQ.D63yLAL-1OD83m-jN1vCwZTHAImEnAbXlYGL6-MHpLQ'
};
fetch(url + '/proyecto_usuario?proyecto_id=eq.4bbbd229-9cee-4498-b2b4-3c56a2197247&select=*', {headers})
  .then(r=>r.json())
  .then(console.log);
