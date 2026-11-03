# Contribute

All Schuly code is on [GitHub](https://github.com/schulydev). Issues labeled `bug` or `feature` are
a good place to start.

## Choose a project

| Project | Stack | Start here |
|---|---|---|
| Mobile app | Flutter | [Development setup](/Schuly/setup/development) |
| Server and web app | ASP.NET Core, Angular | [Development setup](/SchulyServer/setup/development) |
| Plugins | .NET | [Development setup](/SchulyPlugins/setup/development) |
| Plugin contract | .NET, NuGet | [Development setup](/SchulyPluginAbstractions/setup/development) |
| Website | Angular | [Development setup](/SchulyWebsite/setup/development) |
| These docs | VitePress | [Editing these docs](/editing-these-docs) |

## Make a change

Every repository uses the same workflow:

1. Open a labeled issue.
2. Create a branch from `main`, named `feature/<issue#>_PascalCase` or `fix/<issue#>_PascalCase`.
3. Commit with a short, imperative subject, such as `Add agenda filter`.
4. Open a labeled pull request. Its body is a summary and `Closes #<issue>`, with no test plan.
5. Squash-merge the pull request and delete the branch.

Don't commit directly to `main`, and don't add AI attribution to commits, pull requests, or issues.

Each project's **Contributing** page lists its own rules.

## Labels

| Label | Use for |
|---|---|
| `bug` | Something that's broken |
| `enhancement` | An improvement to existing behavior |
| `feature` | New functionality |
| `refactor` | Internal changes with no change in behavior |
| `CI/CD` | Build, release, and workflow changes |
| `dependencies` | Dependency updates |
| `documentation` | Docs-only changes |
