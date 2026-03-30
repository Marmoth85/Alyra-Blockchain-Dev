'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, TrendingUp, Building2, AlertCircle } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface Stock {
    ticker: string;
    name: string;
}

const TICKER_COLORS = [
    'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
    'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
];

// Attribue une couleur déterministe à chaque ticker
// en générant un hash numérique à partir de ses caractères (algorithme djb2),
// puis en sélectionnant une couleur dans le tableau via modulo.
// Ainsi, un même ticker aura toujours la même couleur.
function getTickerColor(ticker: string) {
    let hash = 0;
    for (let i = 0; i < ticker.length; i++) {
        // Décalage de 5 bits + soustraction = multiplication par 31 (nombre premier)
        hash = ticker.charCodeAt(i) + ((hash << 5) - hash);
    }
    return TICKER_COLORS[Math.abs(hash) % TICKER_COLORS.length];
}

const StockPage = () => {
    const [data, setData] = useState<Stock[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get<Stock[]>(
                    'https://dumbstockapi.com/stock?exchanges=NYSE'
                );
                setData(response.data);
            } catch (error) {
                console.error('Erreur', error);
                setError(true);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const filtered = data?.filter(
        (item) =>
            item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.ticker.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-background">
            <div className="mx-auto max-w-5xl px-6 py-16">
                {/* Header */}
                <div className="mb-10">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
                            <TrendingUp className="size-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                                    Stocks
                                </h1>
                                <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 text-xs">
                                    NYSE
                                </Badge>
                            </div>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                                Parcourez les titres cotés au New York Stock Exchange.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                {!isLoading && !error && data && (
                    <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                        <div className="rounded-lg border bg-white p-4 shadow-sm dark:bg-card">
                            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                Total titres
                            </p>
                            <p className="mt-1 text-2xl font-semibold text-foreground">
                                {data.length.toLocaleString()}
                            </p>
                        </div>
                        <div className="rounded-lg border bg-white p-4 shadow-sm dark:bg-card">
                            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                Bourse
                            </p>
                            <p className="mt-1 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
                                NYSE
                            </p>
                        </div>
                        <div className="hidden rounded-lg border bg-white p-4 shadow-sm sm:block dark:bg-card">
                            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                Résultats filtrés
                            </p>
                            <p className="mt-1 text-2xl font-semibold text-blue-600 dark:text-blue-400">
                                {filtered?.length.toLocaleString() ?? 0}
                            </p>
                        </div>
                    </div>
                )}

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-32">
                        <Spinner className="size-6 text-emerald-600" />
                        <p className="text-sm text-muted-foreground">
                            Chargement des données…
                        </p>
                    </div>
                ) : error ? (
                    <Card className="border-red-200 dark:border-red-900/50">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="flex size-9 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                                    <AlertCircle className="size-5 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-red-600 dark:text-red-400">
                                        Erreur de chargement
                                    </CardTitle>
                                    <CardDescription>
                                        Impossible de charger les données. Veuillez réessayer.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader className="border-b">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Building2 className="size-4 text-muted-foreground" />
                                        <CardTitle>Liste des titres</CardTitle>
                                    </div>
                                    <CardDescription className="mt-1">
                                        {filtered?.length ?? 0} résultat{(filtered?.length ?? 0) !== 1 ? 's' : ''}
                                        {search && (
                                            <span className="text-blue-600 dark:text-blue-400">
                                                {' '}pour « {search} »
                                            </span>
                                        )}
                                    </CardDescription>
                                </div>
                                <div className="relative w-full sm:w-72">
                                    <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder="Rechercher…"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 dark:bg-muted/30 dark:hover:bg-muted/30">
                                        <TableHead className="w-[160px] pl-6 text-xs uppercase tracking-wider">
                                            Ticker
                                        </TableHead>
                                        <TableHead className="text-xs uppercase tracking-wider">
                                            Société
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered && filtered.length > 0 ? (
                                        filtered.map((item) => (
                                            <TableRow key={item.ticker}>
                                                <TableCell className="pl-6">
                                                    <span
                                                        className={`inline-flex items-center rounded-md px-2.5 py-0.5 font-mono text-xs font-semibold ${getTickerColor(item.ticker)}`}
                                                    >
                                                        {item.ticker}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-foreground">
                                                    {item.name}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow className="hover:bg-transparent">
                                            <TableCell
                                                colSpan={2}
                                                className="h-32 text-center text-muted-foreground"
                                            >
                                                Aucun résultat trouvé.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default StockPage;
