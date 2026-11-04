import { Check, Copy, Github, Instagram, Linkedin, Mail, MapPin, MessageCircle, Phone, Send } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Reveal, SectionHeading } from "./Reveal";
import { content, safeUrl, whatsappUrl } from "@/lib/content";

export const ContactSection = () => {
  const { profile } = content;
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const endpoint = safeUrl(profile.formEndpoint);
  const socials = [
    { label: "GitHub", href: safeUrl(profile.github), Icon: Github },
    { label: "LinkedIn", href: safeUrl(profile.linkedin), Icon: Linkedin },
    { label: "Instagram", href: safeUrl(profile.instagram), Icon: Instagram },
  ].filter((social) => social.href);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast({ title: "Não consegui copiar", description: profile.email });
    }
  };

  const composeText = ({ name, message }) => `Olá, Michael! Sou ${name}.\n\n${message}`;

  const sendToEndpoint = async (form, data) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(String(response.status));
      toast({ title: "Mensagem enviada!", description: "Obrigado pelo contato. Respondo o mais breve possível." });
      form.reset();
    } catch {
      toast({
        variant: "destructive",
        title: "A mensagem não foi enviada",
        description: `Tente de novo ou escreva direto para ${profile.email}.`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    if (data.website) return; // armadilha para robôs: campo invisível preenchido
    delete data.website;

    if (endpoint) {
      sendToEndpoint(form, data);
      return;
    }

    const channel = event.nativeEvent.submitter?.value;
    if (channel === "whatsapp") {
      window.open(whatsappUrl(profile.whatsapp, composeText(data)), "_blank", "noopener");
      return;
    }

    const subject = encodeURIComponent(`Contato pelo portfólio: ${data.name}`);
    const body = encodeURIComponent(`${composeText(data)}\n\nResponder para: ${data.email}`);
    window.location.href = `mailto:${profile.email}?subject=${subject}&body=${body}`;
    toast({ title: "Abrindo seu e-mail", description: "A mensagem já vai pronta. É só clicar em enviar." });
  };

  return (
    <section id="contact" className="relative z-10 px-4 py-24 md:py-32">
      <div className="container">
        <SectionHeading
          kicker="// abrir canal"
          title="Vamos"
          accent="conversar?"
          text="Estou aberto a estágios, vagas júnior e colaborações. Se você tem uma oportunidade ou uma ideia, me chame."
        />

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
          <Reveal className="space-y-7">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-sans font-semibold">E-mail</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <a href={`mailto:${profile.email}`} className="break-all text-muted-foreground transition-colors hover:text-primary">
                    {profile.email}
                  </a>
                  <button onClick={copyEmail} aria-label="Copiar e-mail" title="Copiar e-mail" className="rounded-md p-1 text-muted-foreground transition-colors hover:text-primary">
                    {copied ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-sans font-semibold">Telefone e WhatsApp</h3>
                <a href={`tel:+${profile.whatsapp.replace(/\D/g, "")}`} className="text-muted-foreground transition-colors hover:text-primary">
                  {profile.phone}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-sans font-semibold">Localização</h3>
                <p className="text-muted-foreground">{profile.location}</p>
              </div>
            </div>

            {socials.length > 0 && (
              <div className="border-t pt-7">
                <h3 className="mb-3 font-sans font-semibold">Conecte-se comigo</h3>
                <div className="flex gap-3">
                  {socials.map(({ label, href, Icon }) => (
                    <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} title={label} className="rounded-full border bg-card/60 p-3 transition-colors hover:border-primary hover:text-primary">
                      <Icon size={20} />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </Reveal>

          <Reveal delay={100} className="gradient-border p-6 md:p-8">
            <h3 className="mb-6 text-2xl font-bold">Envie um sinal</h3>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium">
                  Seu nome
                </label>
                <input type="text" id="name" name="name" required autoComplete="name" className="field" placeholder="Como posso te chamar?" />
              </div>
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium">
                  Seu e-mail
                </label>
                <input type="email" id="email" name="email" required autoComplete="email" className="field" placeholder="voce@empresa.com" />
              </div>
              <div>
                <label htmlFor="message" className="mb-2 block text-sm font-medium">
                  Sua mensagem
                </label>
                <textarea id="message" name="message" required rows={5} className="field resize-y" placeholder="Conte sobre a vaga ou a ideia..." />
              </div>

              {/* Invisível para pessoas; robôs costumam preencher. */}
              <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 opacity-0" />

              {endpoint ? (
                <button type="submit" disabled={isSubmitting} className="cosmic-button w-full">
                  {isSubmitting ? "Enviando..." : "Enviar mensagem"} <Send size={16} />
                </button>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button type="submit" value="email" className="cosmic-button flex-1">
                    Enviar por e-mail <Send size={16} />
                  </button>
                  {profile.whatsapp && (
                    <button type="submit" value="whatsapp" className="ghost-button flex-1">
                      Enviar no WhatsApp <MessageCircle size={16} />
                    </button>
                  )}
                </div>
              )}
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  );
};
