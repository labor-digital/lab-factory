-- One-shot: existing deployments seeded `team_defaults` with empty
-- fly_org_slug. The vast majority of single-developer fly.io accounts use
-- the implicit `personal` org, so flip empty to that. Override later via
-- the dashboard or a direct UPDATE if the team has its own org.
update team_defaults
   set fly_org_slug = 'personal'
 where fly_org_slug is null or fly_org_slug = '';
