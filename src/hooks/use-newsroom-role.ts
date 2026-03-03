import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type NewsroomRole = "owner" | "superadmin" | "admin" | "editor" | "viewer" | null;

interface NewsroomMember {
  id: string;
  user_id: string;
  email: string;
  role: NewsroomRole;
  is_active: boolean;
  created_at: string;
}

export function useNewsroomRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<NewsroomRole>(null);
  const [member, setMember] = useState<NewsroomMember | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRole() {
      if (!user?.id) {
        setRole(null);
        setMember(null);
        setLoading(false);
        return;
      }

      try {
        // Use the security definer function to get role
        const { data, error } = await supabase
          .rpc('get_newsroom_role', { _user_id: user.id });

        if (error) {
          console.error("Error fetching newsroom role:", error);
          setRole(null);
        } else {
          setRole(data as NewsroomRole);
        }

        // Try to get full member info if owner/superadmin
        if (data === 'owner' || data === 'superadmin') {
          const { data: memberData } = await supabase
            .from('newsroom_members')
            .select('*')
            .eq('user_id', user.id)
            .single();
          
          if (memberData) {
            setMember(memberData as unknown as NewsroomMember);
          }
        }
      } catch (err) {
        console.error("Error in useNewsroomRole:", err);
        setRole(null);
      } finally {
        setLoading(false);
      }
    }

    fetchRole();
  }, [user?.id]);

  const isOwner = role === "owner";
  const isSuperadmin = role === "superadmin";
  const isOwnerOrSuperadmin = isOwner || isSuperadmin;
  const isAdmin = role === "admin" || isOwnerOrSuperadmin;
  const isEditor = role === "editor" || isAdmin;
  const isViewer = role === "viewer" || isEditor;
  const hasAccess = role !== null;

  return {
    role,
    member,
    loading,
    isOwner,
    isSuperadmin,
    isOwnerOrSuperadmin,
    isAdmin,
    isEditor,
    isViewer,
    hasAccess,
  };
}