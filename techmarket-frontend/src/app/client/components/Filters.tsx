
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import debounce from "lodash.debounce";
import api from "@/services/api";
import { FilterForm, filterSchema } from "@/lib/schema";

interface FiltersProps {
  onFilterChange: (filters: FilterForm) => void;
}

export function Filters({ onFilterChange }: FiltersProps) {
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FilterForm>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      search: "",
      category: "",
      minPrice: undefined,
      maxPrice: undefined,
    },
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      setValue("search", localStorage.getItem("filter_search") || "");
      setValue("category", localStorage.getItem("filter_category") || "");
      setValue(
        "minPrice",
        Number(localStorage.getItem("filter_minPrice")) || undefined
      );
      setValue(
        "maxPrice",
        Number(localStorage.getItem("filter_maxPrice")) || undefined
      );
    }
  }, [setValue]);

  const selectedCategory = watch("category");

  const debouncedFilterChange = useCallback(
    debounce((filters: FilterForm) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("filter_search", filters.search || "");
        localStorage.setItem("filter_category", filters.category || "");
        localStorage.setItem(
          "filter_minPrice",
          filters.minPrice?.toString() || ""
        );
        localStorage.setItem(
          "filter_maxPrice",
          filters.maxPrice?.toString() || ""
        );
      }
      onFilterChange(filters);
    }, 300),
    [onFilterChange]
  );

  useEffect(() => {
    const subscription = watch((data) => {
      const filters = {
        ...data,
        category: data.category === "all" ? "" : data.category,
      };
      debouncedFilterChange(filters);
    });
    return () => subscription.unsubscribe();
  }, [watch, debouncedFilterChange]);

  useEffect(() => {
    async function loadCategories() {
      setIsLoadingCategories(true);
      try {
        const response = await api.get("/products");
        const uniqueCategories = [
          ...new Set(response.data.map((p: any) => p.category)),
        ];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error("Erro ao carregar categorias:", error);
        toast.error("Erro ao carregar categorias.");
      } finally {
        setIsLoadingCategories(false);
      }
    }
    loadCategories();
  }, []);

  const onSubmit = (data: FilterForm) => {
    const filters = {
      ...data,
      category: data.category === "all" ? "" : data.category,
    };
    debouncedFilterChange(filters);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end"
    >
      <div className="flex-1">
        <label htmlFor="search" className="block text-sm font-medium">
          Buscar por nome
        </label>
        <Input
          id="search"
          {...register("search")}
          placeholder="Digite o nome do produto"
        />
        {errors.search && (
          <p className="text-red-500 text-sm">{errors.search.message}</p>
        )}
      </div>

      <div className="w-full sm:w-48">
        <label htmlFor="category" className="block text-sm font-medium">
          Categoria
        </label>
        <Select
          value={selectedCategory || "all"}
          onValueChange={(value) =>
            setValue("category", value === "all" ? "" : value)
          }
          disabled={isLoadingCategories}
        >
          <SelectTrigger id="category">
            <SelectValue
              placeholder={
                isLoadingCategories
                  ? "Carregando..."
                  : "Selecione uma categoria"
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && (
          <p className="text-red-500 text-sm">{errors.category.message}</p>
        )}
      </div>

      <div className="w-full sm:w-32">
        <label htmlFor="minPrice" className="block text-sm font-medium">
          Preço Mínimo
        </label>
        <Input
          id="minPrice"
          type="number"
          step="0.01"
          {...register("minPrice", { valueAsNumber: true })}
        />
        {errors.minPrice && (
          <p className="text-red-500 text-sm">{errors.minPrice.message}</p>
        )}
      </div>

      <div className="w-full sm:w-32">
        <label htmlFor="maxPrice" className="block text-sm font-medium">
          Preço Máximo
        </label>
        <Input
          id="maxPrice"
          type="number"
          step="0.01"
          {...register("maxPrice", { valueAsNumber: true })}
        />
        {errors.maxPrice && (
          <p className="text-red-500 text-sm">{errors.maxPrice.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isLoadingCategories}>
        {isLoadingCategories ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Carregando...
          </>
        ) : (
          "Aplicar Filtros"
        )}
      </Button>
    </form>
  );
}
