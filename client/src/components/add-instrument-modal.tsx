import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, Search } from "lucide-react";
import { useInstrumentSearch, useAddInstrument } from "@/hooks/use-portfolio";
import { useToast } from "@/hooks/use-toast";
import { InstrumentSearchResult } from "@/types/portfolio";

const formSchema = z.object({
  query: z.string().min(1, "Inserisci nome, ticker o ISIN"),
  type: z.string().min(1, "Seleziona il tipo di strumento"),
  investedAmount: z.string()
    .min(1, "Inserisci l'importo investito")
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, "L'importo deve essere maggiore di zero"),
});

interface AddInstrumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddInstrumentModal({ open, onOpenChange }: AddInstrumentModalProps) {
  const [searchResults, setSearchResults] = useState<InstrumentSearchResult[]>([]);
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentSearchResult | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      query: "",
      type: "",
      investedAmount: "",
    },
  });

  const instrumentSearch = useInstrumentSearch();
  const addInstrument = useAddInstrument();
  const { toast } = useToast();

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.length >= 2) {
        handleSearch(searchQuery);
      } else {
        setSearchResults([]);
        setSelectedInstrument(null);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSearch = async (query: string) => {
    if (query.length < 2) return;

    instrumentSearch.mutate(query, {
      onSuccess: (results) => {
        setSearchResults(results);
        if (results.length === 1) {
          setSelectedInstrument(results[0]);
          form.setValue("type", results[0].type);
        }
      },
      onError: () => {
        toast({
          title: "Errore di ricerca",
          description: "Impossibile cercare lo strumento. Riprova.",
          variant: "destructive",
        });
      }
    });
  };

  const handleInstrumentSelect = (instrument: InstrumentSearchResult) => {
    setSelectedInstrument(instrument);
    form.setValue("query", `${instrument.name} (${instrument.ticker})`);
    form.setValue("type", instrument.type);
    setSearchResults([]);
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!selectedInstrument) {
      toast({
        title: "Strumento non selezionato",
        description: "Seleziona uno strumento dai risultati di ricerca",
        variant: "destructive",
      });
      return;
    }

    addInstrument.mutate({
      name: selectedInstrument.name,
      ticker: selectedInstrument.ticker,
      isin: selectedInstrument.isin,
      type: values.type,
      investedAmount: values.investedAmount,
      currency: selectedInstrument.currency,
    }, {
      onSuccess: () => {
        toast({
          title: "Strumento aggiunto",
          description: `${selectedInstrument.name} è stato aggiunto al tuo portafoglio`,
        });
        onOpenChange(false);
        form.reset();
        setSelectedInstrument(null);
        setSearchResults([]);
        setSearchQuery("");
      },
      onError: (error: any) => {
        const errorMessage = error?.message || "Errore durante l'aggiunta dello strumento";
        toast({
          title: "Errore",
          description: errorMessage,
          variant: "destructive",
        });
      }
    });
  };

  const handleClose = () => {
    onOpenChange(false);
    form.reset();
    setSelectedInstrument(null);
    setSearchResults([]);
    setSearchQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" data-testid="add-instrument-modal">
        <DialogHeader>
          <DialogTitle>Aggiungi Strumento</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="query"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome, Ticker o ISIN</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="es. Apple, AAPL, US0378331005"
                        className="pl-10"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          setSearchQuery(e.target.value);
                        }}
                        data-testid="input-search-instrument"
                      />
                      {instrumentSearch.isPending && (
                        <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Search Results */}
            {searchResults.length > 0 && !selectedInstrument && (
              <div className="border border-border rounded-lg p-2 max-h-48 overflow-y-auto" data-testid="search-results">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleInstrumentSelect(result)}
                    className="w-full text-left p-2 hover:bg-secondary rounded text-sm"
                    data-testid={`search-result-${result.ticker}`}
                  >
                    <div className="font-medium">{result.name}</div>
                    <div className="text-muted-foreground">
                      {result.ticker} • {result.type} • €{result.price.toFixed(2)}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Selected Instrument Validation */}
            {selectedInstrument && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3" data-testid="selected-instrument">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                    Strumento Validato
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {selectedInstrument.name} ({selectedInstrument.ticker})
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Prezzo attuale: €{selectedInstrument.price.toFixed(2)}
                  </p>
                  {selectedInstrument.isin && (
                    <p className="text-xs text-green-600 dark:text-green-400">
                      ISIN: {selectedInstrument.isin}
                    </p>
                  )}
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo di Strumento</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} data-testid="select-instrument-type">
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="azione">Azione</SelectItem>
                      <SelectItem value="ETF">ETF</SelectItem>
                      <SelectItem value="crypto">Criptovaluta</SelectItem>
                      <SelectItem value="obbligazione">Obbligazione</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="investedAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Importo Investito (€)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      {...field}
                      data-testid="input-invested-amount"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleClose}
                data-testid="button-cancel"
              >
                Annulla
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={addInstrument.isPending || !selectedInstrument}
                data-testid="button-add"
              >
                {addInstrument.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Aggiungi
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
