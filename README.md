# UNZA Student App

UNZA student companion web app for campus navigation, timetable support, student chat,
and lecture room bookings.

## Central admin integration

This app connects to the UNZA admin app through `lib/portal.ts`, which is the single
integration entrypoint used by server-side routes and booking services.

Required environment variables:

- `ADMIN_APP_URL` (for local development: `http://localhost:3001`)
- `STUDENT_APP_API_KEY` (must match the key configured on the admin app)

The integration key is never exposed to browser code. Browser requests go through this
app's internal API routes.

For production, configure both deployment projects (for example, both Vercel projects):

1. Set `ADMIN_APP_URL` on the student project to the deployed admin app's HTTPS
   origin, not `localhost`.
2. Set the same nonempty, high-entropy `STUDENT_APP_API_KEY` on both the student
   and admin projects, in the environment used by each deployment. Keep it
   server-only; do not use a `NEXT_PUBLIC_` prefix.
3. Configure both apps to use the same MongoDB cluster **and database**. The
   database must support transactions. The student app prefers `MONGODB_URI`
   over `MONGODB_URL` when both are set.
4. Redeploy both projects after changing their environment variables. Set each
   app's `NEXTAUTH_URL` to its own production HTTPS origin and use distinct,
   strong `NEXTAUTH_SECRET` values.

Check `GET /api/programmes` on the student deployment after redeploying. A
successful response contains `programmes`; staff must configure the real
programme catalogue before registration can work. A 503 with **Student
integration is not configured.** comes from the admin app and means its
`STUDENT_APP_API_KEY` is absent or empty. **Central admin integration is not
configured.** instead means the student app lacks a valid `ADMIN_APP_URL` or
key. A 401 from the admin integration indicates mismatched keys; a 502 means the
student server could not reach the configured admin URL. Do not share the keys
when reporting or diagnosing errors.

## Development

Use Node.js 20.9 or later.

```bash
npm ci
npm run dev
```

App URL: `http://localhost:3000`

## Academic assignment and assessments

Registration uses the administrator-managed programme catalogue, which assigns department and campus automatically. The profile editor cannot change programme, department, campus or year; contact campus staff for academic reassignment. Existing legacy students are not assigned a guessed campus. Administrators must configure real programme mappings before new self-registration.

The home map and scrollable location list share one campus selection and default to the current database profile's assigned campus. Anonymous visitors see public campus places without requesting authenticated room availability. Booking summary times use Africa/Lusaka.

**Quizzes, tests & exams** lists published assessments for the student's exact programme/year. In-person assessments reserve teaching rooms and link to navigation. Online multiple-choice attempts are timed on the server, single-attempt, save each answer and mark final/expired submissions. Scores appear after the window closes; answer keys remain server-only. This does not provide remote proctoring or essay marking.

## Campus-only maps

The map supports Great East Road and Ridgeway campus switching, restricts panning/zoom to the selected campus, and masks areas outside its outline. Only locations with coordinates inside a supported UNZA boundary appear as map markers. Off-campus GPS positions do not move the map away from the university. Routes that leave the selected campus are not displayed as verified on-campus navigation.

Outlines in `lib/campus-geography.ts` must stay synchronized with the portal's `lib/campus/geography.ts`. Sources are OpenStreetMap [relation 9374733](https://www.openstreetmap.org/relation/9374733) and [way 369606883](https://www.openstreetmap.org/way/369606883), retrieved 2026-11-05, copyright OpenStreetMap contributors under [ODbL](https://www.openstreetmap.org/copyright). They are navigation outlines, not cadastral surveys.

## Study Circle resources

Circle members can share links and PDF or DOCX files up to 4 MB on the resource shelf or attach them to a study session. The in-app PDF reader provides page and zoom controls; PDFs can also be downloaded, while DOCX files are downloaded. Resources remain on the shelf if their session is removed. Files are not virus-scanned, so only open material you trust and have permission to share.

## Validation and production launch

Run before deployment:

- `npm run lint`
- `npm run typecheck`
- `npm run build`

Production:

```bash
npm start
```
