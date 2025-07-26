"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { productSchema } from "@/lib/schema";
import { cn } from "@/lib/utils";

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  onSubmit: (data: ProductFormData & { id?: number }) => void;
  initialData?: Partial<ProductFormData> & { id?: number };
}

export function ProductForm({ onSubmit, initialData }: ProductFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      price: initialData?.price?.toString() ?? "",
      category: initialData?.category ?? "",
      stock: initialData?.stock?.toString() ?? "",
      description: initialData?.description ?? "",
      imageUrl: initialData?.imageUrl ?? "",
    },
  });

  const handleFormSubmit = (data: ProductFormData) => {
    const cleaned = {
      ...data,
      name: data.name.trim(),
      category: data.category.trim(),
      description: data.description?.trim() || undefined,
      imageUrl: data.imageUrl?.trim() || undefined,
      id: initialData?.id,
    };

    onSubmit(cleaned);

    if (!initialData?.id) reset();
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="space-y-6 max-w-xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-gray-200"
    >
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        {initialData?.id ? "Editar Produto" : "Adicionar Novo Produto"}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Nome do Produto</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="Ex.: Notebook Dell"
            className={cn(errors.name && "border-red-500")}
          />
          {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Preço (R$)</Label>
          <Input
            id="price"
            type="text"
            inputMode="decimal"
            {...register("price")}
            placeholder="Ex.: 2599.90"
            className={cn(errors.price && "border-red-500")}
          />
          {errors.price && <p className="text-sm text-red-600">{errors.price.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Categoria</Label>
          <Input
            id="category"
            {...register("category")}
            placeholder="Ex.: Informática"
            className={cn(errors.category && "border-red-500")}
          />
          {errors.category && <p className="text-sm text-red-600">{errors.category.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="stock">Estoque</Label>
          <Input
            id="stock"
            type="text"
            inputMode="numeric"
            {...register("stock")}
            placeholder="Ex.: 12"
            className={cn(errors.stock && "border-red-500")}
          />
          {errors.stock && <p className="text-sm text-red-600">{errors.stock.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          {...register("description")}
          rows={4}
          placeholder="Ex.: Notebook leve, com ótimo desempenho e bateria de longa duração."
          className={cn(errors.description && "border-red-500")}
        />
        {errors.description && <p className="text-sm text-red-600">{errors.description.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="imageUrl">URL da Imagem</Label>
        <Input
          id="imageUrl"
          {...register("imageUrl")}
          placeholder="https://exemplo.com/imagem.jpg"
          className={cn(errors.imageUrl && "border-red-500")}
        />
        {errors.imageUrl && <p className="text-sm text-red-600">{errors.imageUrl.message}</p>}
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? "Salvando..." : initialData?.id ? "Atualizar" : "Adicionar"}
        </Button>
      </div>
    </form>
  );
}
