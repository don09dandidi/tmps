# Live Stream Sight: Raport Laborator 2 - Design Patterns

Acest raport detaliază implementarea a trei Design Patterns (Singleton, Builder și Factory Method) în cadrul aplicației web **Live Stream Sight**, conform cerințelor pentru Laboratorul 2 la disciplina TMPS.

Proiectul este o aplicație de monitorizare video și live streaming construită pe o stivă modernă (React, TypeScript, Vite), iar conceptele de programare orientată pe obiecte (OOP) au fost adaptate la structura modulară a limbajului TypeScript.

---

## 1. Builder Pattern

**Scop:** Separarea logicii complexe de creare a unui obiect de reprezentarea sa finală, permițând asamblarea treptată, pas cu pas. Este deosebit de util când un obiect necesită numeroși parametri de configurare opționali sau pași de validare.

**Implementare în proiect:** `src/lib/camera/camera-builder.ts`
* Clasa (sau analogul funcțional) `CameraBuilder` permite configurarea detaliilor unei camere video (nume, URL stream, setări de autentificare, etichete) secvențial, înainte de a apela metoda `build()` pentru a returna obiectul final de tip `Camera`.
* Această abordare evită constructorii aglomerați și previne crearea unor instanțe de camere cu date incomplete sau invalide.

### Diagrama UML - Builder

```mermaid
classDiagram
    class Camera {
        +String id
        +String name
        +String streamUrl
        +Object options
    }
    
    class CameraBuilder {
        -String _name
        -String _streamUrl
        -Object _options
        +setName(name: String) CameraBuilder
        +setStreamUrl(url: String) CameraBuilder
        +setOptions(options: Object) CameraBuilder
        +build() Camera
    }
    
    CameraBuilder ..> Camera : "creează"