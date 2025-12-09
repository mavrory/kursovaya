import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs.jsx";
import { PawPrint, ArrowLeft } from "lucide-react";

export function LoginPage({ onLogin, onNavigate }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [role, setRole] = useState("student"); // выбранная вкладка
    const [isRegistering, setIsRegistering] = useState(false);

    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const API_URL = "http://localhost:5000/api";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg("");
        setLoading(true);

        try {
            if (isRegistering) {

                const res = await fetch(`${API_URL}/auth/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name,
                        email,
                        password,
                        role_name: role,
                    }),
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.message || "Ошибка регистрации");


                // Сохраняем данные
                localStorage.setItem("token", data.token);
                localStorage.setItem("user", JSON.stringify(data.user));

                onLogin(data.user.role_name);

                // Очищаем форму
                setName("");
                setEmail("");
                setPassword("");


            } else {

                const res = await fetch(`${API_URL}/auth/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password }),
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.message || "Ошибка входа");

                // Сохраняем токен
                localStorage.setItem("token", data.token);
                localStorage.setItem("user", JSON.stringify(data.user));

                onLogin(data.user.role_name);
            }
        } catch (err) {
            setErrorMsg(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            {/* Back Button */}
            <button
                onClick={() => onNavigate("home")}
                className="fixed top-6 left-6 flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors"
            >
                <ArrowLeft className="w-5 h-5" />
                <span>На главную</span>
            </button>

            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-2xl flex items-center justify-center">
                            <PawPrint className="w-10 h-10 text-white" />
                        </div>
                    </div>
                    <h2 className="text-neutral-900 mb-2">
                        {isRegistering ? "Регистрация в TutorPaw" : "Добро пожаловать в TutorPaw"}
                    </h2>
                    <p className="text-neutral-600">
                        {isRegistering ? "Создай аккаунт" : "Войди в свой аккаунт"}
                    </p>
                </div>

                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-primary-100">
                    {/* Toggle Login/Register */}
                    <div className="flex gap-2 mb-6 p-1 bg-neutral-100 rounded-lg">
                        <button
                            onClick={() => setIsRegistering(false)}
                            className={`flex-1 py-2 rounded-lg transition-all ${
                                !isRegistering ? "bg-white text-primary-600 shadow-sm" : "text-neutral-600"
                            }`}
                        >
                            Вход
                        </button>
                        <button
                            onClick={() => setIsRegistering(true)}
                            className={`flex-1 py-2 rounded-lg transition-all ${
                                isRegistering ? "bg-white text-primary-600 shadow-sm" : "text-neutral-600"
                            }`}
                        >
                            Регистрация
                        </button>
                    </div>

                    {isRegistering ? (
                        // При регистрации показываем выбор роли (только ученик и репетитор)
                        <Tabs
                            defaultValue="student"
                            onValueChange={(val) => setRole(val)}
                            className="w-full"
                        >
                            <TabsList className="grid w-full grid-cols-2 mb-6">
                                <TabsTrigger value="student">Ученик</TabsTrigger>
                                <TabsTrigger value="tutor">Репетитор</TabsTrigger>
                            </TabsList>

                            <TabsContent value="student">
                                <FormContent
                                    isRegistering={isRegistering}
                                    name={name}
                                    email={email}
                                    password={password}
                                    setName={setName}
                                    setEmail={setEmail}
                                    setPassword={setPassword}
                                    handleSubmit={handleSubmit}
                                    loading={loading}
                                    errorMsg={errorMsg}
                                    buttonTextRegister="Зарегистрироваться как ученик"
                                    buttonTextLogin="Войти как ученик"
                                />
                            </TabsContent>

                            <TabsContent value="tutor">
                                <FormContent
                                    isRegistering={isRegistering}
                                    name={name}
                                    email={email}
                                    password={password}
                                    setName={setName}
                                    setEmail={setEmail}
                                    setPassword={setPassword}
                                    handleSubmit={handleSubmit}
                                    loading={loading}
                                    errorMsg={errorMsg}
                                    buttonTextRegister="Зарегистрироваться как репетитор"
                                    buttonTextLogin="Войти как репетитор"
                                />
                            </TabsContent>
                        </Tabs>
                    ) : (
                        // При входе не показываем выбор роли - роль определяется автоматически
                        <FormContent
                            isRegistering={isRegistering}
                            name={name}
                            email={email}
                            password={password}
                            setName={setName}
                            setEmail={setEmail}
                            setPassword={setPassword}
                            handleSubmit={handleSubmit}
                            loading={loading}
                            errorMsg={errorMsg}
                            buttonTextRegister="Зарегистрироваться"
                            buttonTextLogin="Войти"
                        />
                    )}
                </div>

                <div className="mt-6 text-center">
                    <p className="text-sm text-neutral-600">
                        {isRegistering ? "Уже есть аккаунт?" : "Нет аккаунта?"}{" "}
                        <button
                            onClick={() => setIsRegistering(!isRegistering)}
                            className="text-primary-600 hover:underline"
                        >
                            {isRegistering ? "Войти" : "Зарегистрироваться"}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}

function FormContent({
                         isRegistering,
                         name,
                         email,
                         password,
                         setName,
                         setEmail,
                         setPassword,
                         handleSubmit,
                         loading,
                         errorMsg,
                         buttonTextRegister,
                         buttonTextLogin,
                     }) {
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
                <div>
                    <Label>Имя</Label>
                    <Input
                        type="text"
                        placeholder="Иван Иванов"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>
            )}

            <div>
                <Label>Email</Label>
                <Input
                    type="email"
                    placeholder="example@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>

            <div>
                <Label>Пароль</Label>
                <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </div>

            {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}

            <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white"
            >
                {loading ? "Подождите..." : isRegistering ? buttonTextRegister : buttonTextLogin}
            </Button>
        </form>
    );
}
