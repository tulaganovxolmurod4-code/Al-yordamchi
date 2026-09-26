import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const FORBIDDEN_MEMORY_PATTERNS = [
  /api[_-]?key/i,
  /password/i,
  /secret/i,
  /token/i,
  /card\s?number/i,
  /\bcvv\b/i,
  /bank\s?account/i,
  /private\s?key/i,
];

export function isForbiddenMemory(key, value) {
  const combined = `${key} ${value}`;
  return FORBIDDEN_MEMORY_PATTERNS.some((re) => re.test(combined));
}

export async function getOrCreateUser(tgUser) {
  const { data: existing } = await supabase
    .from("users")
    .select("*")
    .eq("telegram_id", tgUser.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("users")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", existing.id);
    return existing;
  }

  const { data: created, error } = await supabase
    .from("users")
    .insert({
      telegram_id: tgUser.id,
      first_name: tgUser.first_name,
      username: tgUser.username,
      language_code: tgUser.language_code || "en",
    })
    .select("*")
    .single();

  if (error) throw error;
  return created;
}

export async function getOrCreateActiveChat(userId, chatId) {
  if (chatId) {
    const { data } = await supabase.from("chats").select("*").eq("id", chatId).eq("user_id", userId).maybeSingle();
    if (data) return data;
  }
  const { data: latest } = await supabase
    .from("chats")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latest) return latest;

  return createChat(userId);
}

export async function createChat(userId, title = "New Chat") {
  const { data, error } = await supabase
    .from("chats")
    .insert({ user_id: userId, title })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function listChats(userId) {
  const { data, error } = await supabase
    .from("chats")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function deleteChat(userId, chatId) {
  const { error } = await supabase.from("chats").delete().eq("id", chatId).eq("user_id", userId);
  if (error) throw error;
}

export async function getMessages(userId, chatId, limit = 30) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("chat_id", chatId)
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function saveMessage(userId, chatId, role, content) {
  const { error } = await supabase.from("messages").insert({ user_id: userId, chat_id: chatId, role, content });
  if (error) throw error;
  await supabase.from("chats").update({ updated_at: new Date().toISOString() }).eq("id", chatId);
}

export async function getMemory(userId) {
  const { data, error } = await supabase
    .from("memory_entries")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function upsertMemory(userId, key, value, category = "general") {
  if (isForbiddenMemory(key, value)) {
    const err = new Error("Refusing to store secret-like data in memory.");
    err.code = "FORBIDDEN_MEMORY";
    throw err;
  }
  const { data, error } = await supabase
    .from("memory_entries")
    .upsert(
      { user_id: userId, key, value, category, updated_at: new Date().toISOString() },
      { onConflict: "user_id,key" }
    )
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMemory(userId, memoryId) {
  const { error } = await supabase.from("memory_entries").delete().eq("id", memoryId).eq("user_id", userId);
  if (error) throw error;
}

export default supabase;
