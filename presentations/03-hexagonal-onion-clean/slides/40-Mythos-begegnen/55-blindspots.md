# Blind Spots

- Innere Strukturierung
  - **Hexagonal:** komplett agnostisch
  - **Onion:** Domain Services / Domain Model getrennt
  - **Clean:** 
    - Entities: Enterprise Business Rules
    - Use Cases: Application Business Rules


- Modulschnitt 
  - Build-Time vs. Runtime-Module
    - **Beispiel Hexagonal:** Welche Adapter kommen in ein Client-Modul? 
  - fachlich kohäsive Einheiten
    - z.B. je Feature 
    - VSA ggf. besser geeignet?
