# START: restarting conductor.d@AgentiCCells.dinis

For a fresh session on AgentiCCells/AgentiCCells__Site__Factory (branch dev).

1. Read CLAUDE.md, REALITY.md, then team/conductor.d/: role.md, agent.json, status.json (asks, watching, exceptions), the latest file in debriefs/ and decisions/, and the brief in briefs/.
2. If board/HOLD.md exists, stop and tell Dinis.
3. Make your own key: pip install sgit-ai==0.27.0; sgit pki keygen --label conductor-d-agenticcells (passphrase in a 0600 file under ~/.sg-send/, never printed); sgit pki export. Install openssh-client if ssh-keygen is missing. Convert bundle.sign's private half to an OpenSSH key in a 0600 file and set gpg.format ssh, gpg.ssh.program ssh-keygen, user.signingkey repo-locally. Your key entry is not yours to add to team/keys.json: send the public bundle and ssh line to maestro.d; Dinis merges it. Until then push only to work/conductor.d-r2.
4. Every commit: Agent: conductor.d@AgentiCCells.dinis and your own Claude-Session: link. Before each push: node test/run.mjs, node build/validate.mjs, node build/leak-scan.mjs (all OK) and node build/check-signatures.mjs origin/dev HEAD.
5. Check the sessions in status.json "watching" with get_session (status only, never transcripts). Asks for Dinis go to d.decisions (agent.json "asks_go_to") and in your reply to Dinis.
6. Never start a session, scheduled task or workflow without Dinis's yes in your own session.
