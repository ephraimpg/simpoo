#!/usr/bin/env bash
# End-to-end smoke tests against the running production server.
BASE="${BASE:-http://localhost:3100}"
PASS=0; FAIL=0

check() { # name expected actual
  if [ "$2" = "$3" ]; then PASS=$((PASS+1)); echo "PASS  $1"; else FAIL=$((FAIL+1)); echo "FAIL  $1 (expected '$2', got '$3')"; fi
}
contains() { # name haystack needle (literal substring)
  if echo "$2" | grep -qiF -- "$3"; then PASS=$((PASS+1)); echo "PASS  $1"; else FAIL=$((FAIL+1)); echo "FAIL  $1 (missing: '$3')"; fi
}

echo "=== 1. Pages ==="
for path in / /about /academics /admissions /school-life /gallery /contact /admin /login; do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "$BASE$path")
  check "GET $path -> 200" 200 "$code"
done
code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$BASE/does-not-exist")
check "GET unknown -> 404" 404 "$code"

HOME_HTML=$(curl -s --max-time 15 "$BASE/")
contains "Home headline" "$HOME_HTML" "Building Bright Futures"
contains "Home phones" "$HOME_HTML" "0725 958 589"
contains "Home email" "$HOME_HTML" "mainflowp@yahoo.com"
contains "Home nav has staff login link" "$HOME_HTML" 'href="/login"'
contains "Home feature card: Academic Growth" "$HOME_HTML" "Academic Growth"
contains "Home feature card: Parent Partnership" "$HOME_HTML" "Parent Partnership"
contains "Hero CTA: Explore Our School" "$HOME_HTML" "Explore Our School"
contains "Hero CTA: Enquire About Admission" "$HOME_HTML" "Enquire About Admission"
contains "JSON-LD School schema" "$HOME_HTML" "application/ld+json"

CONTACT_HTML=$(curl -s --max-time 15 "$BASE/contact")
contains "Contact: tel link 1" "$CONTACT_HTML" "tel:+254725958589"
contains "Contact: tel link 2" "$CONTACT_HTML" "tel:+254722751770"
contains "Contact: mailto" "$CONTACT_HTML" "mailto:mainflowp@yahoo.com"
if echo "$CONTACT_HTML" | grep -q "google.com/maps"; then FAIL=$((FAIL+1)); echo "FAIL  Contact: maps link still present"; else PASS=$((PASS+1)); echo "PASS  Contact: no maps/location link"; fi
if echo "$CONTACT_HTML" | grep -qi "Kibiko"; then FAIL=$((FAIL+1)); echo "FAIL  Contact: Kibiko Road still present"; else PASS=$((PASS+1)); echo "PASS  Contact: no Kibiko Road reference"; fi
contains "Contact: postal address" "$CONTACT_HTML" "P.O. Box 1199"

ADM_HTML=$(curl -s --max-time 15 "$BASE/admissions")
contains "Admissions: enquiry form" "$ADM_HTML" "guardianName"
contains "Admissions: FAQ section" "$ADM_HTML" "Admissions questions, answered"

GAL_HTML=$(curl -s --max-time 15 "$BASE/gallery")
contains "Gallery: filters" "$GAL_HTML" "Science activities"
contains "Gallery: honesty note" "$GAL_HTML" "not photographs of the school"

ABOUT_HTML=$(curl -s --max-time 15 "$BASE/about")
contains "About: pending marker" "$ABOUT_HTML" "Awaiting school confirmation"

ACAD_HTML=$(curl -s --max-time 15 "$BASE/academics")
contains "Academics: CBE curriculum stated" "$ACAD_HTML" "Competency-Based Education (CBE)"

echo "=== 2. SEO ==="
contains "sitemap lists /admissions" "$(curl -s --max-time 10 "$BASE/sitemap.xml")" "/admissions"
contains "robots blocks /admin" "$(curl -s --max-time 10 "$BASE/robots.txt")" "Disallow: /admin"
contains "robots blocks /login" "$(curl -s --max-time 10 "$BASE/robots.txt")" "/login"
LOGIN_HTML=$(curl -s --max-time 10 "$BASE/login")
contains "Login page: username field" "$LOGIN_HTML" "admin-username"
contains "Login page: password toggle" "$LOGIN_HTML" "Show password"
contains "robots has sitemap" "$(curl -s --max-time 10 "$BASE/robots.txt")" "sitemap.xml"

echo "=== 3. Enquiry form API ==="
R=$(curl -s -w "\n%{http_code}" --max-time 15 -X POST "$BASE/api/enquiries" -H "content-type: application/json" \
  -d '{"type":"admission","guardianName":"Test Guardian","phone":"0725111222","email":"guardian@example.com","gradeOfInterest":"Grade 2","message":"I would like to know about admission for my daughter.","website":""}')
CODE=$(echo "$R" | tail -1); BODY=$(echo "$R" | head -n -1)
check "Valid enquiry -> 201" 201 "$CODE"
contains "Valid enquiry returns id" "$BODY" '"id"'

R=$(curl -s -w "\n%{http_code}" --max-time 15 -X POST "$BASE/api/enquiries" -H "content-type: application/json" \
  -d '{"type":"admission","guardianName":"X","phone":"12345","message":"hi","website":""}')
CODE=$(echo "$R" | tail -1); BODY=$(echo "$R" | head -n -1)
check "Invalid phone/name -> 422" 422 "$CODE"
contains "Field error returned" "$BODY" "fieldErrors"

R=$(curl -s -w "\n%{http_code}" --max-time 15 -X POST "$BASE/api/enquiries" -H "content-type: application/json" \
  -d '{"type":"admission","guardianName":"Bot","phone":"0725000000","message":"spam message here","website":"http://spam"}')
CODE=$(echo "$R" | tail -1)
check "Honeypot -> accepted but discarded" 200 "$CODE"
if grep -q "Bot" data/enquiries.json 2>/dev/null; then FAIL=$((FAIL+1)); echo "FAIL  honeypot was stored"; else PASS=$((PASS+1)); echo "PASS  honeypot not stored"; fi

R=$(curl -s -w "\n%{http_code}" --max-time 15 -X POST "$BASE/api/enquiries" -H "content-type: application/json" \
  -d '{"type":"general","guardianName":"Second Parent","phone":"+254722333444","message":"Please call me about school visits.","website":""}')
CODE=$(echo "$R" | tail -1)
check "Second valid enquiry -> 201" 201 "$CODE"

echo "=== 4. Admin API auth ==="
code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$BASE/api/admin/content")
check "Content without session -> 401" 401 "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$BASE/api/admin/enquiries")
check "Enquiries without session -> 401" 401 "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$BASE/api/admin/gallery?id=x" -X DELETE)
check "Gallery delete without session -> 401" 401 "$code"

R=$(curl -s -w "\n%{http_code}" --max-time 10 -X POST "$BASE/api/admin/login" -H "content-type: application/json" -d '{"password":"wrong-password"}')
check "Wrong password -> 401" 401 "$(echo "$R" | tail -1)"

R=$(curl -s -c cookies.txt -w "\n%{http_code}" --max-time 10 -X POST "$BASE/api/admin/login" -H "content-type: application/json" -d '{"password":"mainflow-admin-2026"}')
check "Correct password -> 200" 200 "$(echo "$R" | tail -1)"
if grep -q "mfp_admin_session" cookies.txt; then PASS=$((PASS+1)); echo "PASS  session cookie set"; else FAIL=$((FAIL+1)); echo "FAIL  session cookie missing"; fi

R=$(curl -s -b cookies.txt -w "\n%{http_code}" --max-time 10 "$BASE/api/admin/content")
CODE=$(echo "$R" | tail -1); BODY=$(echo "$R" | head -n -1)
check "Content with session -> 200" 200 "$CODE"
contains "Content has school name" "$BODY" "Mainflow School"

R=$(curl -s -b cookies.txt --max-time 10 "$BASE/api/admin/enquiries")
contains "Enquiry visible in dashboard" "$BODY$(echo "$R")" "Test Guardian"
contains "Second enquiry visible" "$R" "Second Parent"
if echo "$R" | grep -q '"guardianName":"Bot"'; then FAIL=$((FAIL+1)); echo "FAIL  honeypot enquiry leaked to dashboard"; else PASS=$((PASS+1)); echo "PASS  honeypot not in dashboard"; fi

EQID=$(echo "$R" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
R=$(curl -s -b cookies.txt -w "\n%{http_code}" --max-time 10 -X PATCH "$BASE/api/admin/enquiries" -H "content-type: application/json" -d "{\"id\":\"$EQID\",\"status\":\"replied\"}")
check "PATCH status -> 200" 200 "$(echo "$R" | tail -1)"
contains "Status updated" "$R" "replied"

# Content update round-trip: change the active announcement body, verify it is live, then revert
ORIG=$(curl -s -b cookies.txt --max-time 10 "$BASE/api/admin/content")
UPDATED=$(echo "$ORIG" | sed 's/{"ok":true,"content"://;s/}$//')
# Edit the office announcement AND make it active (the notice bar only renders
# active announcements) so the test controls its own precondition; the revert
# below restores the original body and active flag exactly.
NEW=$(echo "$UPDATED" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{const c=JSON.parse(d);const a=(c.announcements||[]).find(x=>/The school office is receiving enquiries/.test(x.body||""));if(!a)process.exit(2);a.body="TEST-LIVE-EDIT-XYZ";a.active=true;process.stdout.write(JSON.stringify(c))}catch{process.exit(3)}})')
if [ -z "$NEW" ]; then FAIL=$((FAIL+1)); echo "FAIL  could not prepare content payload"; fi
R=$(curl -s -b cookies.txt -w "\n%{http_code}" --max-time 10 -X PUT "$BASE/api/admin/content" -H "content-type: application/json" -d "$NEW")
check "PUT content -> 200" 200 "$(echo "$R" | tail -1)"
contains "Admin edit live without rebuild" "$(curl -s --max-time 10 "$BASE/")" "TEST-LIVE-EDIT-XYZ"
R=$(curl -s -b cookies.txt -o /dev/null -w "%{http_code}" --max-time 10 -X PUT "$BASE/api/admin/content" -H "content-type: application/json" -d "$UPDATED")
check "Revert content -> 200" 200 "$R"
if curl -s --max-time 10 "$BASE/" | grep -q "TEST-LIVE-EDIT-XYZ"; then FAIL=$((FAIL+1)); echo "FAIL  revert not live"; else PASS=$((PASS+1)); echo "PASS  revert is live"; fi

R=$(curl -s -b cookies.txt -o /dev/null -w "%{http_code}" --max-time 10 -X POST "$BASE/api/admin/logout")
check "Logout -> 200" 200 "$R"
code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$BASE/api/admin/content")
check "Content after logout -> 401" 401 "$code"

echo "=== 6. Staff accounts & profiles ==="
# Re-login as admin for this section (username optional; defaults to 'admin').
R=$(curl -s -c cookies.txt -w "\n%{http_code}" --max-time 10 -X POST "$BASE/api/admin/login" -H "content-type: application/json" -d '{"username":"admin","password":"mainflow-admin-2026"}')
check "Admin re-login with username -> 200" 200 "$(echo "$R" | tail -1)"

code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$BASE/api/admin/staff")
check "Staff list without session -> 401" 401 "$code"

R=$(curl -s -b cookies.txt --max-time 10 "$BASE/api/admin/profile")
contains "Profile GET returns admin user" "$R" '"username":"admin"'
if echo "$R" | grep -q 'passwordHash'; then FAIL=$((FAIL+1)); echo "FAIL  profile leaked passwordHash"; else PASS=$((PASS+1)); echo "PASS  profile has no passwordHash"; fi

R=$(curl -s -b cookies.txt -w "\n%{http_code}" --max-time 10 -X PATCH "$BASE/api/admin/profile" -H "content-type: application/json" -d '{"fullName":"School Administrator"}')
check "Profile: no-op update -> 422" 422 "$(echo "$R" | tail -1)"
R=$(curl -s -b cookies.txt -w "\n%{http_code}" --max-time 10 -X PATCH "$BASE/api/admin/profile" -H "content-type: application/json" -d '{"fullName":"Changed Name","currentPassword":"wrong-password"}')
check "Profile: wrong current password -> 401" 401 "$(echo "$R" | tail -1)"
R=$(curl -s -b cookies.txt -w "\n%{http_code}" --max-time 10 -X PATCH "$BASE/api/admin/profile" -H "content-type: application/json" -d '{"currentPassword":"mainflow-admin-2026","newPassword":"short"}')
check "Profile: short new password -> 422" 422 "$(echo "$R" | tail -1)"
R=$(curl -s -b cookies.txt -w "\n%{http_code}" --max-time 10 -X PATCH "$BASE/api/admin/profile" -H "content-type: application/json" -d '{"fullName":"School Administrator (Main)","currentPassword":"mainflow-admin-2026"}')
check "Profile: valid name change -> 200" 200 "$(echo "$R" | tail -1)"
contains "Profile name updated" "$R" "School Administrator (Main)"
R=$(curl -s -b cookies.txt -w "\n%{http_code}" --max-time 10 -X PATCH "$BASE/api/admin/profile" -H "content-type: application/json" -d '{"fullName":"School Administrator","currentPassword":"mainflow-admin-2026"}')
check "Profile: name reverted -> 200" 200 "$(echo "$R" | tail -1)"

# Create a test editor account.
R=$(curl -s -b cookies.txt -w "\n%{http_code}" --max-time 10 -X POST "$BASE/api/admin/staff" -H "content-type: application/json" -d '{"username":"test.editor","fullName":"Test Editor","role":"editor","password":"editor-pass-2026"}')
check "Create editor account -> 201" 201 "$(echo "$R" | tail -1)"
EDITOR_ID=$(echo "$R" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if echo "$R" | grep -q 'passwordHash'; then FAIL=$((FAIL+1)); echo "FAIL  staff create leaked passwordHash"; else PASS=$((PASS+1)); echo "PASS  staff create has no passwordHash"; fi

R=$(curl -s -b cookies.txt -w "\n%{http_code}" --max-time 10 -X POST "$BASE/api/admin/staff" -H "content-type: application/json" -d '{"username":"test.editor","fullName":"Duplicate","role":"editor","password":"editor-pass-2026"}')
check "Duplicate username -> 409" 409 "$(echo "$R" | tail -1)"
R=$(curl -s -b cookies.txt -w "\n%{http_code}" --max-time 10 -X POST "$BASE/api/admin/staff" -H "content-type: application/json" -d '{"username":"weak.pw","fullName":"Weak PW","role":"editor","password":"short"}')
check "Weak password on create -> 422" 422 "$(echo "$R" | tail -1)"
R=$(curl -s -b cookies.txt -w "\n%{http_code}" --max-time 10 -X POST "$BASE/api/admin/staff" -H "content-type: application/json" -d '{"username":"X!","fullName":"Bad Name","role":"editor","password":"editor-pass-2026"}')
check "Invalid username -> 422" 422 "$(echo "$R" | tail -1)"

# Editor sign-in and permission boundaries.
R=$(curl -s -c editor-cookies.txt -w "\n%{http_code}" --max-time 10 -X POST "$BASE/api/admin/login" -H "content-type: application/json" -d '{"username":"test.editor","password":"editor-pass-2026"}')
check "Editor login -> 200" 200 "$(echo "$R" | tail -1)"
code=$(curl -s -b editor-cookies.txt -o /dev/null -w "%{http_code}" --max-time 10 "$BASE/api/admin/staff")
check "Editor staff list -> 403" 403 "$code"
code=$(curl -s -b editor-cookies.txt -o /dev/null -w "%{http_code}" --max-time 10 -X POST "$BASE/api/admin/staff" -H "content-type: application/json" -d '{"username":"x.y","fullName":"X Y","role":"editor","password":"editor-pass-2026"}')
check "Editor create account -> 403" 403 "$code"
code=$(curl -s -b editor-cookies.txt -o /dev/null -w "%{http_code}" --max-time 10 "$BASE/api/admin/content")
check "Editor content access -> 200" 200 "$code"
R=$(curl -s -b editor-cookies.txt -w "\n%{http_code}" --max-time 10 -X PATCH "$BASE/api/admin/profile" -H "content-type: application/json" -d '{"fullName":"Test Editor Jr","currentPassword":"editor-pass-2026"}')
check "Editor own profile update -> 200" 200 "$(echo "$R" | tail -1)"

# Admin guards: cannot demote/delete self; cannot remove the last admin.
R=$(curl -s -b cookies.txt -w "\n%{http_code}" --max-time 10 -X PATCH "$BASE/api/admin/staff" -H "content-type: application/json" -d '{"id":"admin","role":"editor"}')
check "Demote self -> 422" 422 "$(echo "$R" | tail -1)"
R=$(curl -s -b cookies.txt -w "\n%{http_code}" --max-time 10 -X PATCH "$BASE/api/admin/staff" -H "content-type: application/json" -d '{"id":"admin","active":false}')
check "Deactivate self -> 422" 422 "$(echo "$R" | tail -1)"
code=$(curl -s -b cookies.txt -o /dev/null -w "%{http_code}" --max-time 10 -X DELETE "$BASE/api/admin/staff?id=admin")
check "Delete self -> 422" 422 "$code"

# Deactivation kills access; deletion invalidates the session.
R=$(curl -s -b cookies.txt -w "\n%{http_code}" --max-time 10 -X PATCH "$BASE/api/admin/staff" -H "content-type: application/json" -d "{\"id\":\"$EDITOR_ID\",\"active\":false}")
check "Deactivate editor -> 200" 200 "$(echo "$R" | tail -1)"
code=$(curl -s -b editor-cookies.txt -o /dev/null -w "%{http_code}" --max-time 10 "$BASE/api/admin/content")
check "Deactivated editor session -> 401" 401 "$code"
R=$(curl -s -w "\n%{http_code}" --max-time 10 -X POST "$BASE/api/admin/login" -H "content-type: application/json" -d '{"username":"test.editor","password":"editor-pass-2026"}')
check "Deactivated editor login -> 401" 401 "$(echo "$R" | tail -1)"

code=$(curl -s -b cookies.txt -o /dev/null -w "%{http_code}" --max-time 10 -X DELETE "$BASE/api/admin/staff?id=$EDITOR_ID")
check "Delete editor account -> 200" 200 "$code"
code=$(curl -s -b editor-cookies.txt -o /dev/null -w "%{http_code}" --max-time 10 "$BASE/api/admin/content")
check "Deleted editor session -> 401" 401 "$code"
R=$(curl -s -b cookies.txt --max-time 10 "$BASE/api/admin/staff")
if echo "$R" | grep -q '"username":"test.editor"'; then FAIL=$((FAIL+1)); echo "FAIL  deleted editor still listed"; else PASS=$((PASS+1)); echo "PASS  deleted editor gone from list"; fi

echo "=== 7. Faculty roles & functions ==="
# --- Teacher: academics/faqs/activities/gallery only ---
R=$(curl -s -b cookies.txt -w "\n%{http_code}" --max-time 10 -X POST "$BASE/api/admin/staff" -H "content-type: application/json" -d '{"username":"test.teacher","fullName":"Test Teacher","role":"teacher","password":"teacher-pass-2026"}')
check "Create teacher account -> 201" 201 "$(echo "$R" | tail -1)"
R=$(curl -s -c teacher-cookies.txt -w "\n%{http_code}" --max-time 10 -X POST "$BASE/api/admin/login" -H "content-type: application/json" -d '{"username":"test.teacher","password":"teacher-pass-2026"}')
check "Teacher login -> 200" 200 "$(echo "$R" | tail -1)"

code=$(curl -s -b teacher-cookies.txt -o /dev/null -w "%{http_code}" --max-time 10 "$BASE/api/admin/content")
check "Teacher content GET -> 200" 200 "$code"
ORIG_ACAD=$(curl -s -b teacher-cookies.txt --max-time 10 "$BASE/api/admin/content")
ACAD_ONLY=$(echo "$ORIG_ACAD" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{const c=JSON.parse(d).content;console.log(JSON.stringify({academics:c.academics}))}catch{process.exit(1)}})')
if [ -n "$ACAD_ONLY" ]; then
  R=$(curl -s -b teacher-cookies.txt -w "\n%{http_code}" --max-time 10 -X PUT "$BASE/api/admin/content" -H "content-type: application/json" -d "$ACAD_ONLY")
  check "Teacher PUT academics -> 200" 200 "$(echo "$R" | tail -1)"
else
  FAIL=$((FAIL+1)); echo "FAIL  could not build academics-only payload (python missing?)"
fi
R=$(curl -s -b teacher-cookies.txt -w "\n%{http_code}" --max-time 10 -X PUT "$BASE/api/admin/content" -H "content-type: application/json" -d '{"fees":[{"label":"HACK","value":"0"}]}')
check "Teacher PUT fees -> 403" 403 "$(echo "$R" | tail -1)"
contains "Teacher blocked message names the section" "$R" "fees"
R=$(curl -s -b teacher-cookies.txt -w "\n%{http_code}" --max-time 10 -X PUT "$BASE/api/admin/content" -H "content-type: application/json" -d '{"site":{"name":"Hacked School"}}')
check "Teacher PUT site info -> 403" 403 "$(echo "$R" | tail -1)"
contains "Teacher blocked message names the site section" "$R" "site"
code=$(curl -s -b teacher-cookies.txt -o /dev/null -w "%{http_code}" --max-time 10 "$BASE/api/admin/enquiries")
check "Teacher enquiries -> 403" 403 "$code"
code=$(curl -s -b teacher-cookies.txt -o /dev/null -w "%{http_code}" --max-time 10 "$BASE/api/admin/staff")
check "Teacher staff list -> 403" 403 "$code"
# Teachers hold gallery:manage, so a delete of a non-existent photo id is a
# plain 404 (the permission check passes first). Authorization itself is
# verified below with the bursar, whose role has no gallery permission.
code=$(curl -s -b teacher-cookies.txt -o /dev/null -w "%{http_code}" --max-time 10 -X DELETE "$BASE/api/admin/gallery?id=x")
check "Teacher gallery delete of missing photo -> 404" 404 "$code"

# --- Bursar: fees + enquiries, not academics ---
R=$(curl -s -b cookies.txt -w "\n%{http_code}" --max-time 10 -X POST "$BASE/api/admin/staff" -H "content-type: application/json" -d '{"username":"test.bursar","fullName":"Test Bursar","role":"bursar","password":"bursar-pass-2026"}')
check "Create bursar account -> 201" 201 "$(echo "$R" | tail -1)"
R=$(curl -s -c bursar-cookies.txt -w "\n%{http_code}" --max-time 10 -X POST "$BASE/api/admin/login" -H "content-type: application/json" -d '{"username":"test.bursar","password":"bursar-pass-2026"}')
check "Bursar login -> 200" 200 "$(echo "$R" | tail -1)"
code=$(curl -s -b bursar-cookies.txt -o /dev/null -w "%{http_code}" --max-time 10 -X DELETE "$BASE/api/admin/gallery?id=x")
check "Bursar gallery delete -> 403" 403 "$code"
code=$(curl -s -b bursar-cookies.txt -o /dev/null -w "%{http_code}" --max-time 10 "$BASE/api/admin/enquiries")
check "Bursar enquiries -> 200" 200 "$code"
R=$(curl -s -b bursar-cookies.txt -w "\n%{http_code}" --max-time 10 -X PUT "$BASE/api/admin/content" -H "content-type: application/json" -d '{"academics":{"approach":"x"}}')
check "Bursar PUT academics -> 403" 403 "$(echo "$R" | tail -1)"
R=$(curl -s -b bursar-cookies.txt -w "\n%{http_code}" --max-time 10 -X PUT "$BASE/api/admin/content" -H "content-type: application/json" -d '{"fees":[]}')
check "Bursar PUT fees -> 200" 200 "$(echo "$R" | tail -1)"
code=$(curl -s -b bursar-cookies.txt -o /dev/null -w "%{http_code}" --max-time 10 "$BASE/api/admin/staff")
check "Bursar staff list -> 403" 403 "$code"

# --- Head Teacher: staff management allowed ---
R=$(curl -s -b cookies.txt -w "\n%{http_code}" --max-time 10 -X POST "$BASE/api/admin/staff" -H "content-type: application/json" -d '{"username":"test.head","fullName":"Test Head","role":"head","password":"head-teacher-2026"}')
check "Create head teacher account -> 201" 201 "$(echo "$R" | tail -1)"
R=$(curl -s -c head-cookies.txt -w "\n%{http_code}" --max-time 10 -X POST "$BASE/api/admin/login" -H "content-type: application/json" -d '{"username":"test.head","password":"head-teacher-2026"}')
check "Head teacher login -> 200" 200 "$(echo "$R" | tail -1)"
R=$(curl -s -b head-cookies.txt --max-time 10 "$BASE/api/admin/staff")
code=$(curl -s -b head-cookies.txt -o /dev/null -w "%{http_code}" --max-time 10 "$BASE/api/admin/staff")
check "Head teacher staff list -> 200" 200 "$code"
contains "Head teacher sees accounts" "$R" '"username":"admin"'
code=$(curl -s -b head-cookies.txt -o /dev/null -w "%{http_code}" --max-time 10 "$BASE/api/admin/enquiries")
check "Head teacher enquiries -> 200" 200 "$code"

# --- Unknown role rejected ---
R=$(curl -s -b cookies.txt -w "\n%{http_code}" --max-time 10 -X POST "$BASE/api/admin/staff" -H "content-type: application/json" -d '{"username":"bad.role","fullName":"Bad Role","role":"rockstar","password":"whatever-2026"}')
check "Unknown role -> 422" 422 "$(echo "$R" | tail -1)"

echo "=== 8. Role customisation ==="
# --- Reading roles requires a session ---
code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$BASE/api/admin/roles")
check "Roles GET without session -> 401" 401 "$code"
R=$(curl -s -b cookies.txt -w "\n%{http_code}" --max-time 10 "$BASE/api/admin/roles")
check "Roles GET -> 200" 200 "$(echo "$R" | tail -1)"

# --- Only staff managers may change roles ---
R=$(curl -s -b bursar-cookies.txt -w "\n%{http_code}" --max-time 10 -X PUT "$BASE/api/admin/roles" -H "content-type: application/json" -d '{"role":"librarian","permissions":["activities:manage"]}')
check "Bursar PUT roles -> 403" 403 "$(echo "$R" | tail -1)"

# --- Admin customises the teacher role: drop gallery, write duties ---
R=$(curl -s -b cookies.txt -w "\n%{http_code}" --max-time 10 -X PUT "$BASE/api/admin/roles" -H "content-type: application/json" -d '{"role":"teacher","permissions":["academics:manage","faqs:manage","activities:manage","cbc:access"],"duties":["Custom test duty one","Custom test duty two"]}')
check "Admin customises teacher role -> 200" 200 "$(echo "$R" | tail -1)"
contains "Custom duties are stored" "$R" "Custom test duty one"
contains "Teacher marked as modified" "$R" '"customised":["teacher"]'

# --- The API enforces the change immediately ---
code=$(curl -s -b teacher-cookies.txt -o /dev/null -w "%{http_code}" --max-time 10 -X DELETE "$BASE/api/admin/gallery?id=x")
check "Teacher gallery delete without gallery permission -> 403" 403 "$code"

# --- Bad inputs are rejected ---
R=$(curl -s -b cookies.txt -w "\n%{http_code}" --max-time 10 -X PUT "$BASE/api/admin/roles" -H "content-type: application/json" -d '{"role":"teacher","permissions":["not:a:permission"]}')
check "Unknown permission -> 422" 422 "$(echo "$R" | tail -1)"
R=$(curl -s -b cookies.txt -w "\n%{http_code}" --max-time 10 -X PUT "$BASE/api/admin/roles" -H "content-type: application/json" -d '{"role":"rockstar","permissions":["faqs:manage"]}')
check "Unknown role in roles API -> 422" 422 "$(echo "$R" | tail -1)"

# --- Reset restores defaults, and enforcement with them ---
R=$(curl -s -b cookies.txt -w "\n%{http_code}" --max-time 10 -X POST "$BASE/api/admin/roles" -H "content-type: application/json" -d '{"action":"reset","role":"teacher"}')
check "Reset teacher role -> 200" 200 "$(echo "$R" | tail -1)"
contains "Teacher no longer modified" "$R" '"customised":[]'
code=$(curl -s -b teacher-cookies.txt -o /dev/null -w "%{http_code}" --max-time 10 -X DELETE "$BASE/api/admin/gallery?id=x")
check "Teacher gallery delete after reset -> 404" 404 "$code"

# --- Cleanup faculty test accounts (head last: it is a staff manager) ---
for u in test.teacher test.bursar test.head; do
  code=$(curl -s -b cookies.txt -o /dev/null -w "%{http_code}" --max-time 10 -X DELETE "$BASE/api/admin/staff?id=$u")
  check "Cleanup $u -> 200" 200 "$code"
done
R=$(curl -s -b cookies.txt --max-time 10 "$BASE/api/admin/staff")
if echo "$R" | grep -q 'test.teacher\|test.bursar\|test.head'; then FAIL=$((FAIL+1)); echo "FAIL  faculty test accounts still listed"; else PASS=$((PASS+1)); echo "PASS  faculty test accounts cleaned up"; fi

# Admin content PUT still works with the full object (all sections permitted)
ORIG=$(curl -s -b cookies.txt --max-time 10 "$BASE/api/admin/content")
UPDATED=$(echo "$ORIG" | sed 's/{"ok":true,"content"://;s/}$//')
R=$(curl -s -b cookies.txt -o /dev/null -w "%{http_code}" --max-time 10 -X PUT "$BASE/api/admin/content" -H "content-type: application/json" -d "$UPDATED")
check "Admin full-content PUT still -> 200" 200 "$R"

# --- Lockout guard: refuse removing the LAST active staff manager. ---
# Build the scenario from live data: strip staff:manage from the head role
# first (the seeded admin account still covers it), then any further removal
# must be refused — and restoring must work again.
HEAD_PERMS=$(curl -s -b cookies.txt --max-time 10 "$BASE/api/admin/roles" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{const r=JSON.parse(d).roles.find(x=>x.id==="head");console.log(JSON.stringify((r?r.permissions:[]).filter(p=>p!=="staff:manage")))})')
R=$(curl -s -b cookies.txt -w "\n%{http_code}" --max-time 10 -X PUT "$BASE/api/admin/roles" -H "content-type: application/json" -d "{\"role\":\"head\",\"permissions\":$HEAD_PERMS}")
check "Strip head role (admin still covers) -> 200" 200 "$(echo "$R" | tail -1)"
R=$(curl -s -b cookies.txt -w "\n%{http_code}" --max-time 10 -X PUT "$BASE/api/admin/roles" -H "content-type: application/json" -d '{"role":"admin","permissions":["cbc:access"]}')
check "Removing the last staff manager -> 422" 422 "$(echo "$R" | tail -1)"
# Restore: the seeded admin still holds staff:manage, so this must succeed.
R=$(curl -s -b cookies.txt -w "\n%{http_code}" --max-time 10 -X POST "$BASE/api/admin/roles" -H "content-type: application/json" -d '{"action":"reset","role":"head"}')
check "Reset head role -> 200" 200 "$(echo "$R" | tail -1)"
MGR=$(curl -s -b cookies.txt --max-time 10 "$BASE/api/admin/roles" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{const r=JSON.parse(d).roles.find(x=>x.id==="head");console.log(r&&r.permissions.includes("staff:manage")?"yes":"no")})')
check "Head restored as staff manager" "yes" "$MGR"

echo "=== 5. Rate limiting ==="
# 6 more requests push us over the 8-per-10-min window; the last must be 429.
LAST=200
for i in 1 2 3 4 5 6; do
  LAST=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 -X POST "$BASE/api/enquiries" -H "content-type: application/json" \
    -d '{"type":"general","guardianName":"Load Test","phone":"0711000000","message":"Rate limit test message.","website":""}')
done
check "Rate limit kicks in -> 429" 429 "$LAST"

echo "=== 9. AI test papers ==="
MAT='Water conservation means using water carefully so that it is not wasted. At school we close taps after use, repair leaking pipes and collect rain water in tanks for the garden. Households reuse water from washing vegetables to water plants, and farmers use drip irrigation to save water in the fields.'

# --- Authentication ---
code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 -X POST "$BASE/api/cbc/test-paper" -H "content-type: application/json" -d '{}')
check "Test paper without session -> 401" 401 "$code"

# --- A role without cbc:access is refused with a clear reason ---
R=$(curl -s -b cookies.txt -w "\n%{http_code}" --max-time 10 -X POST "$BASE/api/admin/staff" -H "content-type: application/json" -d '{"username":"test.nocbc","fullName":"No CBC User","role":"bursar","password":"nocbc-pass-2026"}')
check "Create no-CBC account -> 201" 201 "$(echo "$R" | tail -1)"
R=$(curl -s -c nocbc-cookies.txt -w "\n%{http_code}" --max-time 10 -X POST "$BASE/api/admin/login" -H "content-type: application/json" -d '{"username":"test.nocbc","password":"nocbc-pass-2026"}')
check "No-CBC login -> 200" 200 "$(echo "$R" | tail -1)"
R=$(curl -s -b nocbc-cookies.txt -w "\n%{http_code}" --max-time 10 -X POST "$BASE/api/cbc/test-paper" -H "content-type: application/json" -d '{"material":{"notes":"x"}}')
CODE=$(echo "$R" | tail -1); BODY=$(echo "$R" | head -n -1)
check "Test paper without cbc:access -> 403" 403 "$CODE"
contains "403 names the missing access" "$BODY" "does not include the CBC workspace"
code=$(curl -s -b nocbc-cookies.txt -o /dev/null -w "%{http_code}" --max-time 10 "$BASE/api/cbc/data")
check "CBC data without cbc:access -> 403" 403 "$code"

# --- Bad input is rejected before any AI call is made ---
R=$(curl -s -b cookies.txt -w "\n%{http_code}" --max-time 10 -X POST "$BASE/api/cbc/test-paper" -H "content-type: application/json" -d '{"material":{"notes":"too short"},"options":{}}')
check "Study material too short -> 422" 422 "$(echo "$R" | tail -1)"
contains "Short material explains the minimum" "$R" "at least 80 characters"

R=$(curl -s -b cookies.txt -w "\n%{http_code}" --max-time 10 -X POST "$BASE/api/cbc/test-paper" -H "content-type: application/json" -d "{\"material\":{\"notes\":\"$MAT\"},\"options\":{\"gradeId\":\"g4\",\"learningAreaId\":\"up-science\",\"questionCount\":99}}")
check "Question count out of range -> 422" 422 "$(echo "$R" | tail -1)"

R=$(curl -s -b cookies.txt -w "\n%{http_code}" --max-time 10 -X POST "$BASE/api/cbc/test-paper" -H "content-type: application/json" -d "{\"material\":{\"notes\":\"$MAT\"},\"options\":{\"gradeId\":\"g4\",\"learningAreaId\":\"up-science\",\"types\":[]}}")
check "No question types -> 422" 422 "$(echo "$R" | tail -1)"

R=$(curl -s -b cookies.txt -w "\n%{http_code}" --max-time 10 -X POST "$BASE/api/cbc/test-paper" -H "content-type: application/json" -d "{\"material\":{\"notes\":\"$MAT\"},\"options\":{\"gradeId\":\"rockstar\",\"learningAreaId\":\"up-science\"}}")
check "Unknown grade -> 422" 422 "$(echo "$R" | tail -1)"

R=$(curl -s -b cookies.txt -w "\n%{http_code}" --max-time 10 -X POST "$BASE/api/cbc/test-paper" -H "content-type: application/json" -d 'not json')
check "Invalid JSON body -> 400" 400 "$(echo "$R" | tail -1)"

# --- Generation contract: a real paper, or a clean explained failure.
#     Never a 500, and never a paper in a failure response. The answer
#     depends on configuration (503 = no key, 502 = provider failed,
#     429 = per-account budget used up), so all three are accepted.
R=$(curl -s -b cookies.txt -w "\n%{http_code}" --max-time 70 -X POST "$BASE/api/cbc/test-paper" -H "content-type: application/json" -d "{\"material\":{\"title\":\"Water conservation\",\"notes\":\"$MAT\"},\"options\":{\"gradeId\":\"g4\",\"learningAreaId\":\"up-science\",\"questionCount\":4,\"totalMarks\":10,\"durationMins\":20,\"types\":[\"mcq\",\"short\"]}}")
CODE=$(echo "$R" | tail -1); BODY=$(echo "$R" | head -n -1)
case "$CODE" in
  200)
    PASS=$((PASS+1)); echo "PASS  Generation succeeded with a live provider -> 200"
    contains "Generated paper has questions" "$BODY" '"questions"'
    contains "Generated paper carries warnings" "$BODY" '"warnings"'
    ;;
  503|502|429)
    PASS=$((PASS+1)); echo "PASS  Generation failed cleanly -> $CODE"
    contains "Failure carries an explanation" "$BODY" '"error"'
    if echo "$BODY" | grep -q '"questions"'; then
      FAIL=$((FAIL+1)); echo "FAIL  a paper was returned alongside the failure status"
    else
      PASS=$((PASS+1)); echo "PASS  no paper in the failure response"
    fi
    ;;
  *)
    FAIL=$((FAIL+1)); echo "FAIL  generation returned '$CODE' (expected 200, 503, 502 or 429)"
    ;;
esac

# --- Papers collection: write, read back, reject junk, delete ---
PAPER_ID=$(curl -s -b cookies.txt --max-time 10 -X POST "$BASE/api/cbc/data" -H "content-type: application/json" -d '{"collection":"papers","record":{"title":"E2E Paper","kind":"test","gradeId":"g4","learningAreaId":"up-science","termId":"","durationMins":30,"difficulty":"balanced","instructions":"Answer all questions.","totalMarks":999,"questions":[{"type":"mcq","marks":2,"text":"Which of these saves water?","options":["Leaving taps running","Fixing leaking pipes","Watering the driveway"],"answer":"Fixing leaking pipes"},{"type":"short","marks":3,"text":"Give two ways to save water at home.","answer":"Any two sensible ways."}]}}' | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{console.log(JSON.parse(d).item.id)}catch{console.log("")}})')
if [ -n "$PAPER_ID" ]; then PASS=$((PASS+1)); echo "PASS  paper created ($PAPER_ID)"; else FAIL=$((FAIL+1)); echo "FAIL  paper was not created"; fi

SNAP=$(curl -s -b cookies.txt --max-time 15 "$BASE/api/cbc/data")
contains "Saved paper appears in the snapshot" "$SNAP" "E2E Paper"
ROW=$(echo "$SNAP" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{const p=JSON.parse(d).data.papers.find(x=>x.title==="E2E Paper");console.log(p?`${p.totalMarks}|${p.questions.length}`:"missing")}catch{console.log("parse-error")}})')
check "totalMarks recomputed from questions (not the client value)" "5|2" "$ROW"

# Unknown keys must never reach disk.
R=$(curl -s -b cookies.txt -w "\n%{http_code}" --max-time 10 -X POST "$BASE/api/cbc/data" -H "content-type: application/json" -d "{\"collection\":\"papers\",\"id\":\"$PAPER_ID\",\"record\":{\"title\":\"E2E Paper\",\"hacked\":true}}")
check "Paper update -> 200" 200 "$(echo "$R" | tail -1)"
SNAP=$(curl -s -b cookies.txt --max-time 15 "$BASE/api/cbc/data")
if echo "$SNAP" | grep -q '"hacked"'; then FAIL=$((FAIL+1)); echo "FAIL  unknown key was stored"; else PASS=$((PASS+1)); echo "PASS  unknown key stripped"; fi

R=$(curl -s -b cookies.txt -w "\n%{http_code}" --max-time 10 -X POST "$BASE/api/cbc/data" -H "content-type: application/json" -d "{\"collection\":\"papers\",\"id\":\"$PAPER_ID\",\"record\":{\"questions\":\"not-a-list\"}}")
check "Non-array questions -> 422" 422 "$(echo "$R" | tail -1)"
R=$(curl -s -b cookies.txt -w "\n%{http_code}" --max-time 10 -X POST "$BASE/api/cbc/data" -H "content-type: application/json" -d "{\"collection\":\"papers\",\"id\":\"$PAPER_ID\",\"record\":{\"title\":\"\"}}")
check "Empty paper title -> 422" 422 "$(echo "$R" | tail -1)"

code=$(curl -s -b cookies.txt -o /dev/null -w "%{http_code}" --max-time 10 -X POST "$BASE/api/cbc/data" -H "content-type: application/json" -d "{\"action\":\"delete\",\"collection\":\"papers\",\"id\":\"$PAPER_ID\"}")
check "Delete paper -> 200" 200 "$code"
SNAP=$(curl -s -b cookies.txt --max-time 15 "$BASE/api/cbc/data")
if echo "$SNAP" | grep -q 'E2E Paper'; then FAIL=$((FAIL+1)); echo "FAIL  deleted paper still listed"; else PASS=$((PASS+1)); echo "PASS  paper gone after delete"; fi

# --- Study material collection ---
R=$(curl -s -b cookies.txt -w "\n%{http_code}" --max-time 10 -X POST "$BASE/api/cbc/data" -H "content-type: application/json" -d '{"collection":"materials","record":{"title":"E2E Notes","gradeId":"g4","learningAreaId":"up-science","notes":"too short"}}')
check "Material with short notes -> 422" 422 "$(echo "$R" | tail -1)"
MAT_ID=$(curl -s -b cookies.txt --max-time 10 -X POST "$BASE/api/cbc/data" -H "content-type: application/json" -d "{\"collection\":\"materials\",\"record\":{\"title\":\"E2E Notes\",\"gradeId\":\"g4\",\"learningAreaId\":\"up-science\",\"termId\":\"\",\"notes\":\"$MAT\"}}" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{console.log(JSON.parse(d).item.id)}catch{console.log("")}})')
if [ -n "$MAT_ID" ]; then PASS=$((PASS+1)); echo "PASS  study material saved"; else FAIL=$((FAIL+1)); echo "FAIL  study material was not saved"; fi
SNAP=$(curl -s -b cookies.txt --max-time 15 "$BASE/api/cbc/data")
contains "Saved material appears in the snapshot" "$SNAP" "E2E Notes"
code=$(curl -s -b cookies.txt -o /dev/null -w "%{http_code}" --max-time 10 -X POST "$BASE/api/cbc/data" -H "content-type: application/json" -d "{\"action\":\"delete\",\"collection\":\"materials\",\"id\":\"$MAT_ID\"}")
check "Delete material -> 200" 200 "$code"

# --- Cleanup the account created for the 403 check ---
code=$(curl -s -b cookies.txt -o /dev/null -w "%{http_code}" --max-time 10 -X DELETE "$BASE/api/admin/staff?id=test.nocbc")
check "Cleanup no-CBC account -> 200" 200 "$code"
R=$(curl -s -b cookies.txt --max-time 10 "$BASE/api/admin/staff")
if echo "$R" | grep -q 'test.nocbc'; then FAIL=$((FAIL+1)); echo "FAIL  no-CBC account still listed"; else PASS=$((PASS+1)); echo "PASS  no-CBC account cleaned up"; fi

echo ""
echo "==============================="
echo "PASS: $PASS   FAIL: $FAIL"
echo "==============================="
[ "$FAIL" -eq 0 ]
