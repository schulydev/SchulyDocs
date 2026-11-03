# Schuly.Plugin.Abstractions

Nutze diese Seiten, um den Plugin-Vertrag nachzuschlagen oder zu ändern.

`Schuly.Plugin.Abstractions` ist der Plugin-Vertrag für den
[Schuly-Server](https://github.com/schulydev/SchulyServer), auf NuGet.org veröffentlicht als
[`Schuly.Plugin.Abstractions`](https://www.nuget.org/packages/Schuly.Plugin.Abstractions). Du referenzierst
das Package und implementierst seine Interfaces. Der Plugin-Host des Servers findet deine Implementierung
und führt sie aus.

Dieses Repo bleibt klein und stabil. Der Vertrag ändert sich selten und folgt strikt Semver. Plugins, die
gegen einen Host gebaut sind, brechen deshalb nicht auf einem anderen.

| Seite | Nutze sie, um |
|---|---|
| [Vertragsreferenz](contract.md) | jedes Interface und Record nachzuschlagen, mit echten Signaturen und der Stelle jedes Members im Plugin-Lebenszyklus |
| [Entwicklung](setup/development.md) | einzurichten, zu bauen, zu testen und einen Pack-Testlauf zu machen |
| [Veröffentlichung](setup/publishing.md) | den NuGet-Release-Ablauf und die Package-Metadaten zu sehen |
| [Versionierung](versioning.md) | eine Versionserhöhung zu wählen und die Labels zu sehen, die Releases steuern |
| [Contributing](contributing.md) | den Abhängigkeitsregeln dieses Repos zu folgen |
