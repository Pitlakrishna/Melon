import QuantumSwarm from "@/components/ui/quantum-swarm";

export default function QuantumSwarmDemo() {
  return (
    <div className="flex min-h-[600px] w-full items-center justify-center bg-neutral-100 p-4 md:p-8 transition-colors duration-300 dark:bg-neutral-950">
      <div className="h-[600px] w-full max-w-5xl overflow-hidden rounded-3xl border border-neutral-200 shadow-2xl dark:border-neutral-900">
        <QuantumSwarm />
      </div>
    </div>
  );
}
