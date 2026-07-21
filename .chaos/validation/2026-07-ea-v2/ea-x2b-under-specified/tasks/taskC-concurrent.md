# Task C — Stop concurrent edits from losing data

We just had an incident: two people had the same task open, both hit save, and one person's
changes silently overwrote the other's. A manager's status update got wiped and nobody noticed
until it caused a missed handoff. Please change how task updates work so this class of
"silently lost edit" can't happen again. Keep the build and tests green.

(You decide the right approach.)
