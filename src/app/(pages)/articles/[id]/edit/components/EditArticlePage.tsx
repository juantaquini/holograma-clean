"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/(providers)/auth-provider";
import { useRouter } from "next/navigation";

import LoadingSketch from "@/components/p5/loading/LoadingSketch";
import ArticleForm from "@/app/(pages)/articles/components/form/ArticleForm";

export default function EditArticlePage({ id }: { id: string }) {
  const { user } = useAuth();
  const router = useRouter();

  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user === undefined) return;

    if (!user) {
      router.replace("/articles");
      return;
    }

    const fetchArticle = async () => {
      try {
        const res = await fetch(`/api/articles/${id}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          router.replace("/articles");
          return;
        }

        const data = await res.json();

        if (data.author_uid !== user.uid) {
          router.replace(`/articles/${id}`);
          return;
        }

        setArticle(data);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id, user, router]);

  if (loading) return <LoadingSketch />;
  if (!article) return null;

  return <ArticleForm mode="edit" article={article} />;
}
