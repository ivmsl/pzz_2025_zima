import { useState } from "react";

export default function SearchUserComponent({searchUsersFn, addChosenUsers, chosenUsers}) {
    const [query, setQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);

    const doSearch = async () => {
        setIsLoadingUsers(true);
        setSearchResults([]);
        const userList = await searchUsersFn(query)
            .then((users) => {
                console.log("users", users);
                if (users.length > 0) {
                    console.log("users", users, "chosenUsers", chosenUsers);
                    setSearchResults(users.filter(user => !chosenUsers.map(c => c.id).includes(user.id)));
                    setShowDropdown(true);
                }
                setIsLoadingUsers(false);
            })
            .catch((error) => { 
                    console.error("Error searching users:", error);
                    setIsLoadingUsers(false);
            });
            
    }

    const handleParticipantSelect = (user) => {
        addChosenUsers(user);
        setQuery("");
        setShowDropdown(false);
        setSearchResults([]);
    }

    return (
        <div className="relative" style={{ marginTop: '0.46rem' }}>
            <input
                type="text"
                placeholder="Dodaj Uczestników"
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value)
                    doSearch();
                }}
                
                onClick={
                    (e) => {
                        if (showDropdown) {
                            setShowDropdown(false);
                        }
                    }
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
        { showDropdown && (
            <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-100 max-h-60 overflow-y-auto">
            {isLoadingUsers ? (
                <div className="px-4 py-2 text-gray-500 text-sm">Ładowanie użytkowników...</div>
            ) : searchResults.length > 0 ? (
                searchResults.map((user) => (
                <button
                    key={user.id}
                    type="button"
                    onClick={() => handleParticipantSelect(user)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex flex-col"
                >
                    <span className="font-medium text-gray-900">{user.username}</span>
                    <span className="text-sm text-gray-500">{user.email}</span>
                </button>
                ))
            ) : (
                <div className="px-4 py-2 text-gray-500 text-sm">
                {query.length > 0 ? "Brak wyników" : "Brak dostępnych użytkowników"}
                </div>
            )}
            </div>
        )}
        </div>

    )


}