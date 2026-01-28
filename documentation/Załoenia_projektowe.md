1. Przygotowywanie środowiska — narzedzi i tak dalej 
        - Kacper — init projektu i wysylanie go na GH
        - Piotr — szkic designu 
        Strony:
                Strona domowa - bez auth
                Strona domowa - z auth 
                        Lista dostępnych wydarzen 
                        Utworzyc wydarzenie
                        Dołącz do wydarzenia
                Strona wydarzenia
                Strona utworzenia wydarzenia
                
        Elementy:
                Element listy wydarzen (Nazwa, twórca, lokalizacja i data)
                Menu ustawień
                Element dołączenia do wydarzenia (okienko wpisywania kodu)
                Element listy uczestników
                Element powiadomień
                Element listy znajomych
                Element glosowania

                
        Flow:
                Tworzymy wydarzenie
                Wpisujemy nazwę, opis, miejsce i czas
                Naciskamy save
                Wydarzenie się rejestrue w bazie
                Naciskamy share — generuje się kod / link
                Inny użytkownik wpisuje kod / przechodzi po linku
                Inny użytkownik dostaje pytanie czy dołączyć do wydarzenia
                Inny uzytkownik potwierdza lub odrzuca zaproszenie
                        Jak potwierdza:
                                Dodaje się do listy urzytkowników
                                Wydarzenie dodaje się do listy wydarzeń
                        Jak odrzuca:
                                Nic
        Flow ze znajomymi:
                Tworzymy wydarzenie
                Wpisujemy nazwę, opis, miejsce i czas
                Wybieramy znajomych, aby zaprosić do wydarzenia
                Naciskamy save
                Znajomy sprawdza zaproszenia do wydarzeń
                Znajomy potwierdza lub odrzuca zaproszenie
                        Jak potwierdza:
                                Dodaje się do listy urzytkowników
                                Wydarzenie dodaje się do listy wydarzeń
                        Jak odrzuca:
                                Zaproszenie do wydarzenia znika ze strony
                                domowej użytkownika
        Wydarzenie:
                Nazwa i opis — obowiązkowe
                Czas — (np. deadline) — obowiązkowy, ale możemy zaznaczyć do
                głosowania
                Miejsce — nieobowiązkowe — ale jeżeli nieobowiązkowe, to trzeba zaznaczyć do głosowania
        
        Utworzenie wydarzenia:
                Tworzymy wydarzenie
                Wpisujemy nazwę, opis, miejsce i czas
                Wybieramy znajomych, aby zaprosić do wydarzenia
                Konfigurujemy głosowania:
                        a) Czas zaznaczony do głosowania — obowiązkowe pojawia
                        się panel utworzenia głosowania nad czasem, przynajmnei
                        dwa warianty 
                        b) Miejsce zaznaczone do głosowania — obowiązkowe
                        pojawia się paneł utworzenia głosowania nad miejscem,
                        przynajmniej dwa warianty
                        c) Możemy utworzyć ogólne głosowanie po kliku
                Naciskamy save

        Redagowanie wydarzenia:
                Pola są takie same jak przy utworzeniu wydarzenia, tylko
                uzupełnione danymi
                Można zaznaczyć czas i miejsce do głosowania (pt utworzenie
                wydarzenia)
                Można dodać ogólne głosowanie nad pytaniami 
                Warianty głosowania nie można edytować ale można dodać 

        Głosowania — utworzenia:
                Przynajmniej dwa warianty
                Deadline na głosowania
                Po deadline przychodzi do stanu zakończonych
                Zakończone głosowania nie można edytować 
                
                



        Graficzna biblioteka
                wybrać — przykład: https://ui.shadcn.com/docs/components/button. 
