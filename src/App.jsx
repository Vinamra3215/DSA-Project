import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Users, BarChart3, Sparkles, BookOpen, Play, RotateCcw, Download, Upload, Shuffle, Zap } from 'lucide-react';

// Particle system for animations
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 4;
    this.vy = (Math.random() - 0.5) * 4;
    this.life = 1;
    this.color = color;
    this.size = Math.random() * 3 + 2;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= 0.02;
    this.vy += 0.1;
  }

  draw(ctx) {
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

// Enhanced Graph Visualization Component
const GraphVisualization = ({ people, transactions, animationSteps, currentStep, showOptimized, balances }) => {
  const canvasRef = useRef(null);
  const [nodePositions, setNodePositions] = useState({});
  const [particles, setParticles] = useState([]);
  const [pulsePhase, setPulsePhase] = useState(0);
  const animationFrameRef = useRef();

  useEffect(() => {
    if (people.length === 0) return;

    const positions = {};
    const radius = 200;
    const centerX = 400;
    const centerY = 300;
    const angleStep = (2 * Math.PI) / people.length;

    people.forEach((person, idx) => {
      const angle = idx * angleStep - Math.PI / 2;
      positions[person] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
    });

    setNodePositions(positions);
  }, [people]);

  useEffect(() => {
    const animate = () => {
      setPulsePhase(prev => (prev + 0.05) % (Math.PI * 2));
      
      setParticles(prev => {
        const updated = prev.filter(p => p.life > 0);
        updated.forEach(p => p.update());
        return updated;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (showOptimized && currentStep >= 0 && animationSteps[currentStep]) {
      const step = animationSteps[currentStep];
      if (step.type === 'transaction') {
        const fromPos = nodePositions[step.from];
        const toPos = nodePositions[step.to];
        
        if (fromPos && toPos) {
          const newParticles = [];
          for (let i = 0; i < 20; i++) {
            const midX = (fromPos.x + toPos.x) / 2;
            const midY = (fromPos.y + toPos.y) / 2;
            newParticles.push(new Particle(midX, midY, '#10b981'));
          }
          setParticles(prev => [...prev, ...newParticles]);
        }
      }
    }
  }, [currentStep, showOptimized, animationSteps, nodePositions]);

  useEffect(() => {
    if (!canvasRef.current || Object.keys(nodePositions).length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = 800 * dpr;
    canvas.height = 600 * dpr;
    canvas.style.width = '800px';
    canvas.style.height = '600px';
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, 800, 600);

    const getPersonColor = (person) => {
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
      const index = people.indexOf(person);
      return colors[index % colors.length];
    };

    // Draw edges (transactions)
    const edgesToDraw = showOptimized && animationSteps.length > 0
      ? animationSteps.slice(0, currentStep + 1).filter(s => s.type === 'transaction')
      : transactions;

    edgesToDraw.forEach((txn, idx) => {
      const from = nodePositions[txn.from];
      const to = nodePositions[txn.to];
      if (!from || !to) return;

      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const angle = Math.atan2(dy, dx);

      const startX = from.x + 35 * Math.cos(angle);
      const startY = from.y + 35 * Math.sin(angle);
      const endX = to.x - 35 * Math.cos(angle);
      const endY = to.y - 35 * Math.sin(angle);

      const controlX = (startX + endX) / 2 + 30 * Math.cos(angle + Math.PI / 2);
      const controlY = (startY + endY) / 2 + 30 * Math.sin(angle + Math.PI / 2);

      const currentStepData = showOptimized && animationSteps[currentStep];
      const isActive = showOptimized && currentStepData && currentStepData.type === 'transaction' &&
                       currentStepData.from === txn.from && currentStepData.to === txn.to;

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(controlX, controlY, endX, endY);
      
      if (showOptimized) {
        ctx.strokeStyle = isActive ? '#10b981' : '#6366f1';
        ctx.lineWidth = isActive ? 5 : 3;
        ctx.shadowColor = isActive ? '#10b981' : '#6366f1';
        ctx.shadowBlur = isActive ? 20 : 5;
      } else {
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 0;
      }
      
      ctx.stroke();

      const arrowSize = 12;
      const endAngle = Math.atan2(endY - controlY, endX - controlX);
      
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - arrowSize * Math.cos(endAngle - Math.PI / 6),
        endY - arrowSize * Math.sin(endAngle - Math.PI / 6)
      );
      ctx.lineTo(
        endX - arrowSize * Math.cos(endAngle + Math.PI / 6),
        endY - arrowSize * Math.sin(endAngle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fill();

      const midX = (startX + endX) / 2 + 20 * Math.cos(angle + Math.PI / 2);
      const midY = (startY + endY) / 2 + 20 * Math.sin(angle + Math.PI / 2);
      
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(midX - 25, midY - 12, 50, 24);
      
      ctx.fillStyle = isActive ? '#10b981' : '#fbbf24';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`$${txn.amount.toFixed(0)}`, midX, midY);
    });

    particles.forEach(p => p.draw(ctx));

    // Draw nodes (people)
    people.forEach((person, idx) => {
      const pos = nodePositions[person];
      if (!pos) return;

      const currentStepData = showOptimized && animationSteps[currentStep];
      const isActive = currentStepData && 
                       ((currentStepData.type === 'transaction' && 
                         (currentStepData.from === person || currentStepData.to === person)) ||
                        (currentStepData.type === 'consider' && 
                         currentStepData.people && currentStepData.people.includes(person)) ||
                        (currentStepData.type === 'select' && 
                         (currentStepData.creditor === person || currentStepData.debtor === person)));

      const pulseSize = isActive ? 5 + Math.sin(pulsePhase * 3) * 3 : 0;
      const nodeRadius = 30 + pulseSize;

      if (isActive) {
        ctx.shadowColor = getPersonColor(person);
        ctx.shadowBlur = 25 + Math.sin(pulsePhase * 3) * 10;
      } else {
        ctx.shadowColor = getPersonColor(person);
        ctx.shadowBlur = 15;
      }

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, nodeRadius, 0, 2 * Math.PI);
      ctx.fillStyle = getPersonColor(person);
      ctx.fill();
      
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      if (isActive) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, nodeRadius + 8, 0, 2 * Math.PI);
        ctx.strokeStyle = getPersonColor(person);
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(person[0].toUpperCase(), pos.x, pos.y);

      // Show balance if available
      const balance = balances && balances[person];
      if (balance !== undefined && balance !== 0) {
        const balanceText = balance > 0 ? `+$${balance.toFixed(0)}` : `-$${Math.abs(balance).toFixed(0)}`;
        ctx.fillStyle = balance > 0 ? '#10b981' : '#ef4444';
        ctx.font = 'bold 11px Arial';
        ctx.fillText(balanceText, pos.x, pos.y - 45);
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Arial';
      ctx.fillText(person, pos.x, pos.y + 50);
    });

  }, [nodePositions, transactions, animationSteps, currentStep, showOptimized, people, particles, pulsePhase, balances]);

  if (people.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white/50">
        <div className="text-center">
          <Users size={64} className="mx-auto mb-4 opacity-30" />
          <p>Add people to see graph visualization</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center w-full h-full">
      <canvas
        ref={canvasRef}
        className="rounded-xl"
        style={{ width: '800px', height: '600px' }}
      />
    </div>
  );
};

// Cash Flow Minimizer Component with Web Worker
const CashFlowMinimizer = () => {
  const [people, setPeople] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationSteps, setAnimationSteps] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [animationInterval, setAnimationInterval] = useState(null);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('greedy');
  const [algorithmResults, setAlgorithmResults] = useState([]);
  const [currentBalances, setCurrentBalances] = useState({});

  const [personName, setPersonName] = useState('');
  const [fromPerson, setFromPerson] = useState('');
  const [toPerson, setToPerson] = useState('');
  const [amount, setAmount] = useState('');
  const [customVertexCount, setCustomVertexCount] = useState(5);
  const [showCustomGenerator, setShowCustomGenerator] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1500);
  
  const workerRef = useRef(null);

  // Initialize Web Worker with FIXED TIMING
  useEffect(() => {
    const workerCode = `
      // Algorithm implementations in worker
      const greedyAlgorithm = (netAmount) => {
        const steps = [];
        const balances = [];
        Object.entries(netAmount).forEach(([person, amount]) => {
          if (Math.abs(amount) > 0.01) {
            balances.push({ person, amount });
          }
        });
        steps.push({ type: 'info', message: 'Starting greedy algorithm - optimized O(N²) with simple linear scans' });
        steps.push({ type: 'consider', people: balances.map(b => b.person) });
        const minimized = [];
        // Optimized O(N²) greedy: Simple linear scan, no sorting overhead
        while (true) {
          // Single pass O(N) - Find both max creditor and max debtor together
          let maxCreditIdx = -1;
          let maxDebitIdx = -1;
          let maxCredit = 0;
          let maxDebit = 0;
          
          for (let i = 0; i < balances.length; i++) {
            if (balances[i].amount > maxCredit) {
              maxCredit = balances[i].amount;
              maxCreditIdx = i;
            }
            if (balances[i].amount < -maxDebit) {
              maxDebit = -balances[i].amount;
              maxDebitIdx = i;
            }
          }
          // Check if we're done
          if (maxCredit < 0.01 && maxDebit < 0.01) {
            steps.push({ type: 'info', message: 'All balances settled' });
            break;
          }
          const creditor = balances[maxCreditIdx];
          const debtor = balances[maxDebitIdx];
          steps.push({ 
            type: 'select', 
            creditor: creditor.person, 
            debtor: debtor.person,
            message: \`Greedy: Found max creditor \${creditor.person} (\${creditor.amount.toFixed(0)}) and max debtor \${debtor.person} (\${Math.abs(debtor.amount).toFixed(0)})\` 
          });
          const settleAmount = Math.min(creditor.amount, maxDebit);
          const transaction = {
            from: debtor.person,
            to: creditor.person,
            amount: settleAmount
          };
          minimized.push(transaction);
          steps.push({ 
            type: 'transaction', 
            ...transaction,
            message: \`\${debtor.person} pays \${settleAmount.toFixed(2)} to \${creditor.person}\` 
          });
          // Update balances in-place (faster than creating new arrays)
          creditor.amount -= settleAmount;
          debtor.amount += settleAmount;
          if (creditor.amount < 0.01) {
            steps.push({ type: 'info', message: \`\${creditor.person} settled completely\` });
          }
          if (Math.abs(debtor.amount) < 0.01) {
            steps.push({ type: 'info', message: \`\${debtor.person} settled completely\` });
          }
        }
        return { transactions: minimized, steps };
      };

      const heapBasedAlgorithm = (netAmount) => {
        const steps = [];
        const creditors = [];
        const debtors = [];

        Object.entries(netAmount).forEach(([person, amount]) => {
          if (amount > 0.01) creditors.push({ person, amount });
          if (amount < -0.01) debtors.push({ person, amount: -amount });
        });

        steps.push({ type: 'info', message: 'Sorting creditors and debtors by amount (heap simulation)' });
        
        creditors.sort((a, b) => b.amount - a.amount);
        debtors.sort((a, b) => b.amount - a.amount);

        steps.push({ type: 'consider', people: [...creditors.map(c => c.person), ...debtors.map(d => d.person)] });

        const minimized = [];

        while (creditors.length > 0 && debtors.length > 0) {
          const creditor = creditors[0];
          const debtor = debtors[0];

          steps.push({ 
            type: 'select', 
            creditor: creditor.person, 
            debtor: debtor.person,
            message: \`Heap top: \${debtor.person} (\${debtor.amount.toFixed(0)}) → \${creditor.person} (\${creditor.amount.toFixed(0)})\` 
          });

          const settleAmount = Math.min(creditor.amount, debtor.amount);

          const transaction = {
            from: debtor.person,
            to: creditor.person,
            amount: settleAmount
          };

          minimized.push(transaction);
          steps.push({ 
            type: 'transaction', 
            ...transaction,
            message: \`Transaction: \${settleAmount.toFixed(2)}\` 
          });

          creditor.amount -= settleAmount;
          debtor.amount -= settleAmount;

          if (creditor.amount < 0.01) {
            steps.push({ type: 'info', message: \`Removing \${creditor.person} from heap\` });
            creditors.shift();
          }
          if (debtor.amount < 0.01) {
            steps.push({ type: 'info', message: \`Removing \${debtor.person} from heap\` });
            debtors.shift();
          }

          steps.push({ type: 'info', message: 'Re-heapifying...' });
          creditors.sort((a, b) => b.amount - a.amount);
          debtors.sort((a, b) => b.amount - a.amount);
        }

        return { transactions: minimized, steps };
      };

      const sortingAlgorithm = (netAmount) => {
        const steps = [];
        const balances = [];

        Object.entries(netAmount).forEach(([person, amount]) => {
          if (Math.abs(amount) > 0.01) {
            balances.push({ person, amount });
          }
        });

        steps.push({ type: 'info', message: 'Sorting all balances from positive to negative' });
        balances.sort((a, b) => b.amount - a.amount);

        steps.push({ type: 'consider', people: balances.map(b => b.person) });

        const minimized = [];
        let left = 0;
        let right = balances.length - 1;

        while (left < right) {
          const creditor = balances[left];
          const debtor = balances[right];

          if (creditor.amount < 0.01) {
            steps.push({ type: 'info', message: \`Skipping \${creditor.person} (settled)\` });
            left++;
            continue;
          }
          if (debtor.amount > -0.01) {
            steps.push({ type: 'info', message: \`Skipping \${debtor.person} (settled)\` });
            right--;
            continue;
          }

          steps.push({ 
            type: 'select', 
            creditor: creditor.person, 
            debtor: debtor.person,
            message: \`Two-pointer: \${debtor.person} and \${creditor.person}\` 
          });

          const settleAmount = Math.min(creditor.amount, -debtor.amount);

          const transaction = {
            from: debtor.person,
            to: creditor.person,
            amount: settleAmount
          };

          minimized.push(transaction);
          steps.push({ 
            type: 'transaction', 
            ...transaction,
            message: \`Settling \${settleAmount.toFixed(2)}\` 
          });

          creditor.amount -= settleAmount;
          debtor.amount += settleAmount;

          if (creditor.amount < 0.01) {
            steps.push({ type: 'info', message: \`\${creditor.person} settled, moving left pointer\` });
            left++;
          }
          if (debtor.amount > -0.01) {
            steps.push({ type: 'info', message: \`\${debtor.person} settled, moving right pointer\` });
            right--;
          }
        }

        return { transactions: minimized, steps };
      };

      const minCashFlowRecursive = (netAmount) => {
        const steps = [];
        const balances = [];

        Object.entries(netAmount).forEach(([person, amount]) => {
          if (Math.abs(amount) > 0.01) {
            balances.push({ person, amount });
          }
        });

        if (balances.length === 0) return { transactions: [], steps: [{ type: 'info', message: 'No transactions needed' }] };

        steps.push({ type: 'info', message: 'Finding optimal solution recursively' });

        const minimized = [];

        const minTransactions = (balances) => {
          let maxCredit = 0, maxDebit = 0;
          let maxCreditIdx = -1, maxDebitIdx = -1;

          steps.push({ type: 'consider', people: balances.map(b => b.person) });

          for (let i = 0; i < balances.length; i++) {
            if (balances[i].amount > maxCredit) {
              maxCredit = balances[i].amount;
              maxCreditIdx = i;
            }
            if (balances[i].amount < maxDebit) {
              maxDebit = balances[i].amount;
              maxDebitIdx = i;
            }
          }

          if (maxCredit === 0 && maxDebit === 0) {
            steps.push({ type: 'info', message: 'All balances settled' });
            return;
          }

          steps.push({ 
            type: 'select', 
            creditor: balances[maxCreditIdx].person, 
            debtor: balances[maxDebitIdx].person,
            message: \`Max creditor: \${balances[maxCreditIdx].person}, Max debtor: \${balances[maxDebitIdx].person}\` 
          });

          const settleAmount = Math.min(maxCredit, -maxDebit);

          const transaction = {
            from: balances[maxDebitIdx].person,
            to: balances[maxCreditIdx].person,
            amount: settleAmount
          };

          minimized.push(transaction);
          steps.push({ 
            type: 'transaction', 
            ...transaction,
            message: \`Recursive step: \${settleAmount.toFixed(2)}\` 
          });

          balances[maxCreditIdx].amount -= settleAmount;
          balances[maxDebitIdx].amount += settleAmount;

          minTransactions(balances);
        };

        minTransactions(balances);
        return { transactions: minimized, steps };
      };

      const priorityQueueAlgorithm = (netAmount) => {
        const steps = [];
        const creditors = [];
        const debtors = [];

        Object.entries(netAmount).forEach(([person, amount]) => {
          if (amount > 0.01) creditors.push({ person, amount, priority: amount });
          if (amount < -0.01) debtors.push({ person, amount: -amount, priority: -amount });
        });

        steps.push({ type: 'info', message: 'Using priority queues for optimal matching' });

        const sortByPriority = (arr) => arr.sort((a, b) => b.priority - a.priority);

        sortByPriority(creditors);
        sortByPriority(debtors);

        steps.push({ type: 'consider', people: [...creditors.map(c => c.person), ...debtors.map(d => d.person)] });

        const minimized = [];

        while (creditors.length > 0 && debtors.length > 0) {
          const creditor = creditors[0];
          const debtor = debtors[0];

          steps.push({ 
            type: 'select', 
            creditor: creditor.person, 
            debtor: debtor.person,
            message: \`Priority match: \${debtor.person} (priority: \${debtor.priority.toFixed(0)}) → \${creditor.person} (priority: \${creditor.priority.toFixed(0)})\` 
          });

          const settleAmount = Math.min(creditor.amount, debtor.amount);

          const transaction = {
            from: debtor.person,
            to: creditor.person,
            amount: settleAmount
          };

          minimized.push(transaction);
          steps.push({ 
            type: 'transaction', 
            ...transaction,
            message: \`Priority transaction: \${settleAmount.toFixed(2)}\` 
          });

          creditor.amount -= settleAmount;
          debtor.amount -= settleAmount;
          creditor.priority = creditor.amount;
          debtor.priority = debtor.amount;

          if (creditor.amount < 0.01) {
            steps.push({ type: 'info', message: \`Dequeuing \${creditor.person}\` });
            creditors.shift();
          }
          if (debtor.amount < 0.01) {
            steps.push({ type: 'info', message: \`Dequeuing \${debtor.person}\` });
            debtors.shift();
          }

          sortByPriority(creditors);
          sortByPriority(debtors);
        }

        return { transactions: minimized, steps };
      };

      // Worker message handler with PROPER BENCHMARKING
      self.onmessage = function(e) {
        const { algorithm, netAmount } = e.data;
        
        let algorithmFunc;
        switch (algorithm) {
          case 'greedy':
            algorithmFunc = greedyAlgorithm;
            break;
          case 'heapBased':
            algorithmFunc = heapBasedAlgorithm;
            break;
          case 'sorting':
            algorithmFunc = sortingAlgorithm;
            break;
          case 'minCashFlow':
            algorithmFunc = minCashFlowRecursive;
            break;
          case 'priorityQueue':
            algorithmFunc = priorityQueueAlgorithm;
            break;
          default:
            algorithmFunc = greedyAlgorithm;
        }
        
        // STEP 1: Warm-up runs (5 times) to let JIT compile and optimize
        for (let i = 0; i < 5; i++) {
          const warmupData = JSON.parse(JSON.stringify(netAmount));
          algorithmFunc(warmupData);
        }
        
        // STEP 2: Pre-clone data for actual benchmark runs
        const iterations = 50; // 50 runs for statistical accuracy
        const clonedData = [];
        for (let i = 0; i < iterations; i++) {
          clonedData.push(JSON.parse(JSON.stringify(netAmount)));
        }
        
        // STEP 3: Actual timed runs (only algorithm execution)
        const times = [];
        let result;
        
        for (let i = 0; i < iterations; i++) {
          const startTime = performance.now();
          result = algorithmFunc(clonedData[i]);
          const endTime = performance.now();
          times.push(endTime - startTime);
        }
        
        // STEP 4: Statistical analysis
        times.sort((a, b) => a - b);
        
        // Remove outliers (top and bottom 10%)
        const trimCount = Math.floor(iterations * 0.1);
        const trimmedTimes = times.slice(trimCount, iterations - trimCount);
        
        // Calculate median (most robust)
        const medianTime = trimmedTimes[Math.floor(trimmedTimes.length / 2)];
        
        // Calculate average
        const avgTime = trimmedTimes.reduce((a, b) => a + b, 0) / trimmedTimes.length;
        
        // Min and max from trimmed data
        const minTime = trimmedTimes[0];
        const maxTime = trimmedTimes[trimmedTimes.length - 1];
        
        self.postMessage({
          result,
          executionTime: avgTime, // Use average of trimmed times
          medianTime: medianTime,
          avgTime: avgTime,
          allTimes: times,
          minTime: minTime,
          maxTime: maxTime
        });
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    workerRef.current = new Worker(workerUrl);

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        URL.revokeObjectURL(workerUrl);
      }
    };
  }, []);

  const addPerson = () => {
    if (personName.trim() && !people.includes(personName.trim())) {
      setPeople([...people, personName.trim()]);
      setPersonName('');
    }
  };

  const addTransaction = () => {
    if (fromPerson && toPerson && amount && fromPerson !== toPerson) {
      setTransactions([...transactions, { from: fromPerson, to: toPerson, amount: parseFloat(amount) }]);
      setFromPerson('');
      setToPerson('');
      setAmount('');
    }
  };

  const generateRandom = () => {
    const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank'];
    const numPeople = Math.floor(Math.random() * 3) + 4;
    const selectedPeople = names.slice(0, numPeople);
    
    setPeople(selectedPeople);
    
    const randomTransactions = [];
    const numTransactions = Math.floor(Math.random() * 5) + 5;
    
    for (let i = 0; i < numTransactions; i++) {
      const from = selectedPeople[Math.floor(Math.random() * selectedPeople.length)];
      let to = selectedPeople[Math.floor(Math.random() * selectedPeople.length)];
      while (to === from) {
        to = selectedPeople[Math.floor(Math.random() * selectedPeople.length)];
      }
      const amt = Math.floor(Math.random() * 90) + 10;
      randomTransactions.push({ from, to, amount: amt });
    }
    
    setTransactions(randomTransactions);
    reset();
  };

  const generateCustomRandom = () => {
    const allNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry', 'Iris', 'Jack', 
                      'Kelly', 'Liam', 'Mia', 'Noah', 'Olivia', 'Peter', 'Quinn', 'Ryan', 'Sophia', 'Tyler'];
    
    const numPeople = Math.min(Math.max(customVertexCount, 2), 20);
    const selectedPeople = allNames.slice(0, numPeople);
    
    setPeople(selectedPeople);
    
    const randomTransactions = [];
    const numTransactions = Math.floor(Math.random() * (numPeople * 1.5)) + numPeople * 1.5;
    
    for (let i = 0; i < numTransactions; i++) {
      const from = selectedPeople[Math.floor(Math.random() * selectedPeople.length)];
      let to = selectedPeople[Math.floor(Math.random() * selectedPeople.length)];
      while (to === from) {
        to = selectedPeople[Math.floor(Math.random() * selectedPeople.length)];
      }
      const amt = Math.floor(Math.random() * 90) + 10;
      randomTransactions.push({ from, to, amount: amt });
    }
    
    setTransactions(randomTransactions);
    setShowCustomGenerator(false);
    reset();
  };

  const saveState = () => {
    const state = { people, transactions };
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cashflow-state.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadState = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const state = JSON.parse(e.target.result);
        setPeople(state.people || []);
        setTransactions(state.transactions || []);
        reset();
      } catch (error) {
        alert('Invalid file format');
      }
    };
    reader.readAsText(file);
  };

  const getPersonColor = (person) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
    const index = people.indexOf(person);
    return colors[index % colors.length];
  };

  const minimizeCashFlow = () => {
    if (people.length === 0 || transactions.length === 0) return;

    setIsAnimating(true);
    setShowResults(false);
    setCurrentStep(-1);

    const netAmount = {};
    people.forEach(person => netAmount[person] = 0);

    transactions.forEach(({ from, to, amount }) => {
      netAmount[from] -= amount;
      netAmount[to] += amount;
    });

    setCurrentBalances(netAmount);

    // Use Web Worker for calculation
    if (workerRef.current) {
      workerRef.current.onmessage = (e) => {
        const { result, executionTime, avgTime, allTimes, minTime, maxTime } = e.data;

        const totalCashFlow = result.transactions.reduce((sum, t) => sum + t.amount, 0);

        const newResult = {
          algorithm: selectedAlgorithm,
          transactions: result.transactions.length,
          executionTime: executionTime,
          avgTime: avgTime,
          minTime: minTime,
          maxTime: maxTime,
          allTimes: allTimes,
          reduction: ((1 - result.transactions.length / transactions.length) * 100).toFixed(1),
          totalCashFlow: totalCashFlow
        };

        setAlgorithmResults(prev => {
          const filtered = prev.filter(r => r.algorithm !== selectedAlgorithm);
          return [...filtered, newResult];
        });

        setAnimationSteps(result.steps);

        let step = -1;
        const interval = setInterval(() => {
          step++;
          setCurrentStep(step);
          if (step >= result.steps.length - 1) {
            clearInterval(interval);
            setTimeout(() => {
              setIsAnimating(false);
              setShowResults(true);
            }, 1000);
          }
        }, animationSpeed);

        setAnimationInterval(interval);
      };

      // Send work to worker with high-resolution timing
      workerRef.current.postMessage({
        algorithm: selectedAlgorithm,
        netAmount: netAmount
      });
    }
  };

  const reset = () => {
    if (animationInterval) {
      clearInterval(animationInterval);
      setAnimationInterval(null);
    }
    setCurrentStep(-1);
    setIsAnimating(false);
    setShowResults(false);
    setAnimationSteps([]);
    setCurrentBalances({});
  };

  const clearAll = () => {
    reset();
    setPeople([]);
    setTransactions([]);
    setAlgorithmResults([]);
  };

  const getCurrentStepMessage = () => {
    if (currentStep < 0 || currentStep >= animationSteps.length) return '';
    return animationSteps[currentStep].message || '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Users className="text-yellow-400" size={48} />
            <h1 className="text-5xl font-bold text-white">Cash Flow Minimizer</h1>
          </div>
          <p className="text-blue-200 text-lg">Multi-Algorithm Graph Visualization with Web Worker-Powered Timing</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Sparkles className="text-yellow-400" />
              Configuration
            </h2>

            <div className="mb-6">
              <label className="block text-white mb-2 font-semibold">Select Algorithm</label>
              <select
                value={selectedAlgorithm}
                onChange={(e) => setSelectedAlgorithm(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                disabled={isAnimating}
              >
                <option value="greedy" className="bg-slate-700">Greedy Algorithm</option>
                <option value="heapBased" className="bg-slate-700">Heap-Based</option>
                <option value="sorting" className="bg-slate-700">Sorting-Based</option>
                <option value="priorityQueue" className="bg-slate-700">Priority Queue</option>
                <option value="minCashFlow" className="bg-slate-700">Min Cash Flow Recursive</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-white mb-2 font-semibold">Add Person</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addPerson()}
                  placeholder="Name"
                  className="flex-1 px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  disabled={isAnimating}
                />
                <button
                  onClick={addPerson}
                  disabled={isAnimating}
                  className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-xl font-bold hover:scale-105 transition-transform disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>

            {people.length > 0 && (
              <div className="mb-6">
                <p className="text-white/70 mb-2">People ({people.length}):</p>
                <div className="flex flex-wrap gap-2">
                  {people.map((person, idx) => (
                    <span
                      key={idx}
                      className="px-4 py-2 rounded-full text-white font-semibold shadow-lg"
                      style={{ backgroundColor: getPersonColor(person) }}
                    >
                      {person}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {people.length >= 2 && (
              <div className="space-y-3">
                <label className="block text-white font-semibold">Add Transaction</label>
                <select
                  value={fromPerson}
                  onChange={(e) => setFromPerson(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  disabled={isAnimating}
                >
                  <option value="" className="bg-slate-700">From</option>
                  {people.map((person, idx) => (
                    <option key={idx} value={person} className="bg-slate-700">{person}</option>
                  ))}
                </select>
                <select
                  value={toPerson}
                  onChange={(e) => setToPerson(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  disabled={isAnimating}
                >
                  <option value="" className="bg-slate-700">To</option>
                  {people.map((person, idx) => (
                    <option key={idx} value={person} className="bg-slate-700">{person}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Amount"
                  className="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  disabled={isAnimating}
                />
                <button
                  onClick={addTransaction}
                  disabled={isAnimating}
                  className="w-full px-6 py-3 bg-gradient-to-r from-green-400 to-cyan-500 text-white rounded-xl font-bold hover:scale-105 transition-transform disabled:opacity-50"
                >
                  Add Transaction
                </button>
              </div>
            )}

            {transactions.length > 0 && (
              <div className="mt-6">
                <p className="text-white/70 mb-2">Transactions ({transactions.length}):</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {transactions.map((txn, idx) => (
                    <div key={idx} className="bg-white/10 p-2 rounded-lg text-sm">
                      <span className="text-white">
                        <span style={{ color: getPersonColor(txn.from) }} className="font-bold">{txn.from}</span>
                        {' → '}
                        <span style={{ color: getPersonColor(txn.to) }} className="font-bold">{txn.to}</span>
                        {' '}
                        <span className="text-yellow-400 font-bold">${txn.amount.toFixed(0)}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 space-y-3">
              <button
                onClick={generateRandom}
                disabled={isAnimating}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold hover:scale-105 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Shuffle size={20} />
                Quick Random (4-6 people)
              </button>

              <button
                onClick={() => setShowCustomGenerator(!showCustomGenerator)}
                disabled={isAnimating}
                className="w-full px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-bold hover:scale-105 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Users size={20} />
                Custom Random Generator
              </button>

              {showCustomGenerator && (
                <div className="bg-white/5 p-4 rounded-xl space-y-3 border border-white/10">
                  <label className="block text-white font-semibold">
                    Number of People: {customVertexCount}
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="20"
                    value={customVertexCount}
                    onChange={(e) => setCustomVertexCount(parseInt(e.target.value))}
                    className="w-full"
                    disabled={isAnimating}
                  />
                  <div className="flex justify-between text-white/50 text-xs">
                    <span>2</span>
                    <span>20</span>
                  </div>
                  <button
                    onClick={generateCustomRandom}
                    disabled={isAnimating}
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-400 to-cyan-500 text-white rounded-xl font-bold hover:scale-105 transition-transform disabled:opacity-50"
                  >
                    Generate with {customVertexCount} People
                  </button>
                </div>
              )}
              
              {transactions.length > 0 && !showResults && (
                <button
                  onClick={minimizeCashFlow}
                  disabled={isAnimating}
                  className="w-full px-6 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-bold hover:scale-105 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Play size={20} />
                  {isAnimating ? 'Optimizing...' : 'Start Optimization'}
                </button>
              )}
              
              {(isAnimating || showResults) && (
                <button
                  onClick={reset}
                  className="w-full px-6 py-3 bg-white/20 text-white rounded-xl font-bold hover:bg-white/30 transition flex items-center justify-center gap-2"
                >
                  <RotateCcw size={20} />
                  Reset Animation
                </button>
              )}
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={saveState}
                  disabled={isAnimating || people.length === 0}
                  className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-xl font-bold hover:bg-blue-500/30 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  Save
                </button>
                <label className="px-4 py-2 bg-green-500/20 text-green-300 rounded-xl font-bold hover:bg-green-500/30 transition cursor-pointer flex items-center justify-center gap-2">
                  <Upload size={16} />
                  Load
                  <input
                    type="file"
                    accept=".json"
                    onChange={loadState}
                    className="hidden"
                    disabled={isAnimating}
                  />
                </label>
              </div>
              
              <button
                onClick={clearAll}
                disabled={isAnimating}
                className="w-full px-6 py-3 bg-red-500/20 text-red-300 rounded-xl font-bold hover:bg-red-500/30 transition disabled:opacity-50"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">
                {!isAnimating && !showResults && 'Original Transaction Graph'}
                {isAnimating && 'Algorithm Visualization in Progress...'}
                {showResults && 'Optimized Transaction Graph'}
              </h2>
              {isAnimating && (
                <div className="bg-green-500/20 px-4 py-2 rounded-full animate-pulse">
                  <span className="text-green-400 font-bold">
                    Step {currentStep + 1} / {animationSteps.length}
                  </span>
                </div>
              )}
            </div>

            {isAnimating && (
              <div className="mb-4 bg-white/5 p-4 rounded-xl border border-white/10">
                <label className="block text-white mb-2 font-semibold text-sm">
                  Animation Speed: {animationSpeed}ms per step
                </label>
                <input
                  type="range"
                  min="300"
                  max="3000"
                  step="100"
                  value={animationSpeed}
                  onChange={(e) => setAnimationSpeed(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-white/50 text-xs mt-1">
                  <span>Fast (300ms)</span>
                  <span>Slow (3000ms)</span>
                </div>
              </div>
            )}

            <div className="bg-slate-900/50 rounded-xl p-4" style={{ height: '600px' }}>
              <GraphVisualization
                people={people}
                transactions={transactions}
                animationSteps={animationSteps}
                currentStep={currentStep}
                showOptimized={isAnimating || showResults}
                balances={currentBalances}
              />
            </div>

            {isAnimating && getCurrentStepMessage() && (
              <div className="mt-4 bg-gradient-to-r from-green-500/20 to-cyan-500/20 p-4 rounded-xl animate-pulse border border-green-400/30">
                <div className="flex items-center gap-3">
                  <Zap className="text-yellow-400" size={24} />
                  <p className="text-white text-center text-lg flex-1">
                    {getCurrentStepMessage()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {showResults && (
          <>
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20 shadow-2xl mb-6">
              <h3 className="text-2xl font-bold text-white mb-4 text-center">✨ Optimization Complete!</h3>
              <div className="grid grid-cols-5 gap-4">
                <div className="text-center bg-gradient-to-br from-yellow-500/20 to-orange-500/20 p-6 rounded-xl">
                  <p className="text-4xl font-bold text-yellow-400 mb-2">{transactions.length}</p>
                  <p className="text-white/70 font-semibold text-sm">Original Transactions</p>
                </div>
                <div className="text-center bg-gradient-to-br from-green-500/20 to-cyan-500/20 p-6 rounded-xl">
                  <p className="text-4xl font-bold text-green-400 mb-2">
                    {animationSteps.filter(s => s.type === 'transaction').length}
                  </p>
                  <p className="text-white/70 font-semibold text-sm">Optimized Transactions</p>
                </div>
                <div className="text-center bg-gradient-to-br from-pink-500/20 to-purple-500/20 p-6 rounded-xl">
                  <p className="text-4xl font-bold text-pink-400 mb-2">
                    {transactions.length > 0 ? ((1 - animationSteps.filter(s => s.type === 'transaction').length / transactions.length) * 100).toFixed(0) : 0}%
                  </p>
                  <p className="text-white/70 font-semibold text-sm">Transaction Reduction</p>
                </div>
                <div className="text-center bg-gradient-to-br from-blue-500/20 to-indigo-500/20 p-6 rounded-xl">
                  <p className="text-4xl font-bold text-blue-400 mb-2">
                    {algorithmResults.find(r => r.algorithm === selectedAlgorithm)?.executionTime.toFixed(4) || 0}
                  </p>
                  <p className="text-white/70 font-semibold text-sm">Avg Time (ms)</p>
                </div>
                <div className="text-center bg-gradient-to-br from-teal-500/20 to-emerald-500/20 p-6 rounded-xl">
                  <p className="text-4xl font-bold text-teal-400 mb-2">
                    ${algorithmResults.find(r => r.algorithm === selectedAlgorithm)?.totalCashFlow.toFixed(0) || 0}
                  </p>
                  <p className="text-white/70 font-semibold text-sm">Total Cash Flow</p>
                </div>
              </div>
            </div>

            {algorithmResults.length > 1 && (
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20 shadow-2xl mb-6">
                <h3 className="text-2xl font-bold text-white mb-4">📊 Algorithm Comparison</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-white">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="px-4 py-3 text-left">Algorithm</th>
                        <th className="px-4 py-3 text-center">Transactions</th>
                        <th className="px-4 py-3 text-center">Reduction %</th>
                        <th className="px-4 py-3 text-center">Cash Flow</th>
                        <th className="px-4 py-3 text-center">Avg Time (ms)</th>
                        <th className="px-4 py-3 text-center">Efficiency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {algorithmResults
                        .sort((a, b) => {
                          if (a.transactions !== b.transactions) return a.transactions - b.transactions;
                          if (a.totalCashFlow !== b.totalCashFlow) return a.totalCashFlow - b.totalCashFlow;
                          return a.executionTime - b.executionTime;
                        })
                        .map((result, idx) => {
                          const algorithmNames = {
                            greedy: 'Greedy',
                            heapBased: 'Heap-Based',
                            sorting: 'Sorting',
                            priorityQueue: 'Priority Queue',
                            minCashFlow: 'Min Cash Flow'
                          };
                          const isBest = idx === 0;
                          return (
                            <tr 
                              key={result.algorithm} 
                              className={`border-b border-white/10 ${isBest ? 'bg-green-500/20' : ''}`}
                            >
                              <td className="px-4 py-3 font-semibold">
                                {algorithmNames[result.algorithm]}
                                {isBest && <span className="ml-2 text-yellow-400">👑</span>}
                              </td>
                              <td className="px-4 py-3 text-center font-bold text-green-400">
                                {result.transactions}
                              </td>
                              <td className="px-4 py-3 text-center font-bold text-pink-400">
                                {result.reduction}%
                              </td>
                              <td className="px-4 py-3 text-center font-bold text-teal-400">
                                ${result.totalCashFlow.toFixed(0)}
                              </td>
                              <td className="px-4 py-3 text-center font-bold text-blue-400">
                                {result.executionTime.toFixed(4)}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-24 bg-white/10 rounded-full h-2">
                                    <div 
                                      className="bg-gradient-to-r from-green-400 to-cyan-500 h-2 rounded-full"
                                      style={{ width: `${100 - (result.transactions / transactions.length * 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-xs">{(100 - (result.transactions / transactions.length * 100)).toFixed(0)}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 bg-blue-500/10 border border-blue-400/30 p-4 rounded-xl">
                  <p className="text-blue-200 text-sm text-center">
                    <span className="font-bold">⚡ Web Worker Powered:</span> Each algorithm runs 50 times in an isolated thread after 5 warm-up runs. 
                    Average time (with outliers removed) in milliseconds ensures accurate, consistent performance measurements without UI interference.
                  </p>
                </div>
              </div>
            )}

            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20 shadow-2xl">
              <h3 className="text-2xl font-bold text-white mb-4">🔬 Algorithm Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-4 rounded-xl">
                  <h4 className="text-white font-bold mb-2">Greedy Algorithm</h4>
                  <p className="text-white/70 text-sm mb-2">Matches creditors with debtors iteratively. Minimizes both transaction count and cash flow by settling largest amounts first.</p>
                  <p className="text-yellow-400 text-xs">Time: O(N²) | Space: O(N)</p>
                </div>
                <div className="bg-gradient-to-br from-green-500/20 to-cyan-500/20 p-4 rounded-xl">
                  <h4 className="text-white font-bold mb-2">Heap-Based Algorithm</h4>
                  <p className="text-white/70 text-sm mb-2">Uses max-heap property with re-sorting. Prioritizes largest balances to minimize transactions efficiently.</p>
                  <p className="text-yellow-400 text-xs">Time: O(N log N) | Space: O(N)</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 p-4 rounded-xl">
                  <h4 className="text-white font-bold mb-2">Sorting-Based Algorithm</h4>
                  <p className="text-white/70 text-sm mb-2">Single sort with two-pointer technique. Efficiently matches opposite balances to minimize both metrics.</p>
                  <p className="text-yellow-400 text-xs">Time: O(N log N) | Space: O(N)</p>
                </div>
                <div className="bg-gradient-to-br from-teal-500/20 to-emerald-500/20 p-4 rounded-xl">
                  <h4 className="text-white font-bold mb-2">Priority Queue Algorithm</h4>
                  <p className="text-white/70 text-sm mb-2">Maintains dynamic priority queues. Optimal for minimizing transactions while keeping cash flow minimal.</p>
                  <p className="text-yellow-400 text-xs">Time: O(N log N) | Space: O(N)</p>
                </div>
                <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 p-4 rounded-xl">
                  <h4 className="text-white font-bold mb-2">Min Cash Flow Recursive</h4>
                  <p className="text-white/70 text-sm mb-2">Recursive optimal solution. Finds minimum transactions by exploring maximum creditor-debtor pairs.</p>
                  <p className="text-yellow-400 text-xs">Time: O(N²) | Space: O(N)</p>
                </div>
                <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-4 rounded-xl">
                  <h4 className="text-white font-bold mb-2">Web Worker Benefits</h4>
                  <p className="text-white/70 text-sm mb-2">Isolated thread execution eliminates UI interference. Multiple runs with warm-up ensure accurate, reproducible timing.</p>
                  <p className="text-yellow-400 text-xs">Consistent Performance ⚡</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CashFlowMinimizer;