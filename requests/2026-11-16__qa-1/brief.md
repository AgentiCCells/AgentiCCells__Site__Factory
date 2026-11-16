# Brief: factory pipeline QA 1

Dinis, 2026-11-16: "in fact we should be trying to create some as part of this CI pipeline ... AgentiCCells__Site__Factory__Pipeline__QA-1, AgentiCCells__Site__Factory__Pipeline__QA-2, AgentiCCells__Site__Factory__Pipeline__QA-3 etc...".

The first end-to-end test of the factory: the pipeline creates the repository, seeds it from the template, sets Pages, adds the DNS record, deploys, and checks that https://qa-1.agenticcells.site serves the seeded commit. The site holds only the placeholder page. It is thrown away by a teardown request once teardown (FAC-006) exists.
