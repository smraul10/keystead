export interface Item {
  id: string;
  title: string;
  username: string;
  password: string;
  url: string;
  notes: string;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
  // When the item was moved to the trash; null if it is not in the trash
  deletedAt: string | null;
}
