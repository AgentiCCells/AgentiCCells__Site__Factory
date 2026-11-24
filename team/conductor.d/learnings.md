# Learnings, conductor.d

- Relayed words do not pass other sessions' permission checks. Ask Dinis to say it in the session where the action happens.
- A container-wide gpg.ssh.program can override a repo-local signing key. Set it repo-locally and verify each commit; ssh-keygen may need installing (openssh-client).
- Rebuilding a release by cherry-pick re-signs other agents' commits. Fast-forward or merge keeps their signatures; never force-push, push a rebased branch under a new name.
- A finding from a test run is worth an immediate check by the dev; one found a live security issue (rank 40, 22 Nov).
- Do not publish details of an unfixed vulnerability in a live system; name it by rank and point to the owner's notes.
- Two accounts building one cell need one owner early (G1 settled the Email Cell).
- Write session ids as full https://claude.ai/code/session_... links; the leak scan flags bare ids.
