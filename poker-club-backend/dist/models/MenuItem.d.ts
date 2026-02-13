import { MenuCategory } from './MenuCategory';
export declare class MenuItem {
    id: string;
    name: string;
    description?: string;
    price: number;
    imageUrl?: string;
    isAvailable: boolean;
    sortOrder: number;
    category: MenuCategory;
    categoryId: string;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=MenuItem.d.ts.map